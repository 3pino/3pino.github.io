/**
 * Main Application
 * Orchestrates all components and manages application lifecycle
 */

import { AppState } from '../state/AppState';
import { MetadataForm } from './components/MetadataForm';
import { NMRTable } from './components/NMRTable';
import { RichTextEditor } from './components/RichTextEditor';
import { Toolbar } from './components/Toolbar';
import { FocusManager } from './navigation/FocusManager';

// Import from existing modules
import { Metadata } from '../models/Metadata';
import { NMRPeak } from '../models/NMRPeak';
import { NMRData } from '../models/NMRData';

export class NMRFormatterApp {
    private appState: AppState;
    private metadataForm: MetadataForm;
    private nmrTable: NMRTable;
    private richTextEditor: RichTextEditor;
    private toolbar: Toolbar;
    private focusManager: FocusManager;

    constructor() {
        this.appState = new AppState();

        // Initialize focus manager
        this.focusManager = new FocusManager([], () => {
            const firstInput = this.nmrTable.getFirstInput();
            firstInput?.focus();
        });

        // Initialize metadata form
        this.metadataForm = new MetadataForm(
            this.appState.metadata,
            this.appState.validation,
            (currentField, reverse) => {
                this.focusManager.focusNextMetadataField(currentField, reverse);
            }
        );

        // Update focus manager with metadata fields
        this.focusManager = new FocusManager(
            this.metadataForm.getFieldOrder(),
            () => {
                const firstInput = this.nmrTable.getFirstInput();
                firstInput?.focus();
            }
        );

        // Initialize NMR table
        this.nmrTable = new NMRTable(
            this.appState.table,
            this.appState.validation,
            () => {
                // On multiplicity change
                this.appState.validation.clearAllErrors();
            },
            (reverse) => {
                // On navigate to metadata
                const fields = this.metadataForm.getFieldOrder();
                if (reverse) {
                    fields[fields.length - 1]?.focus();
                }
            }
        );

        // Initialize rich text editor
        this.richTextEditor = new RichTextEditor();

        // Initialize toolbar
        this.toolbar = new Toolbar();

        // Initialize event listeners
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Convert down button (Table → Rich Text)
        const convertDownBtn = document.getElementById('convert-down-btn');
        convertDownBtn?.addEventListener('click', () => {
            this.generateFormattedText();
        });

        // Copy button
        const copyBtn = document.getElementById('copy-btn');
        copyBtn?.addEventListener('click', () => {
            this.copyFormattedText();
        });
    }

    private generateFormattedText(): void {
        try {
            // Validate and highlight errors
            const hasErrors = this.validateAndHighlightTable();

            // Get metadata
            const metadataData = this.appState.metadata.getData();
            const metadata = new Metadata(
                metadataData.nuclei as any, // HTML content as nuclei type
                metadataData.solvent as any, // HTML content as solvent type
                metadataData.frequency
            );

            // Get peaks from table state
            const tableRows = this.appState.table.getRows();
            const peaks: NMRPeak[] = [];

            tableRows.forEach(row => {
                const shift = this.parseChemicalShift(row.shift);
                const multiplicity = this.convertMultiplicityToText(row.multiplicity);

                if (shift !== null) {
                    const peak = new NMRPeak(
                        shift,
                        multiplicity,
                        row.jValues,
                        row.integration,
                        row.assignment
                    );
                    peaks.push(peak);
                }
            });

            if (peaks.length === 0) {
                this.richTextEditor.showPlaceholder();
                return;
            }

            // Sort peaks by chemical shift
            this.sortPeaksByShift(peaks, metadataData.sortOrder);

            const nmrData = new NMRData(peaks, metadata);

            // Generate formatted text
            const generateFormattedText = (window as any).generateFormattedText;
            const formattedText = generateFormattedText(
                nmrData,
                metadataData.shiftPrecision,
                metadataData.jPrecision,
                0
            );

            this.richTextEditor.setContent(formattedText);

            if (hasErrors) {
                console.log('Generated text with validation errors present');
            }
        } catch (error: any) {
            console.error('Error generating formatted text:', error);
            this.richTextEditor.showError(error.message);
        }
    }

    private validateAndHighlightTable(): boolean {
        let hasErrors = false;

        // Validate metadata
        const metadataData = this.appState.metadata.getData();

        if (!metadataData.nuclei || metadataData.nuclei.trim() === '') {
            this.appState.validation.setError('nuclei', 'Nuclei is required');
            hasErrors = true;
        }

        if (!metadataData.solvent || metadataData.solvent.trim() === '') {
            this.appState.validation.setError('solvent', 'Solvent is required');
            hasErrors = true;
        }

        if (!metadataData.frequency || metadataData.frequency === 0) {
            this.appState.validation.setError('frequency', 'Frequency is required');
            hasErrors = true;
        }

        // Validate table rows
        const tableRows = this.appState.table.getRows();
        const is1HNMR = metadataData.nuclei.includes('1') && metadataData.nuclei.includes('H');

        tableRows.forEach(row => {
            const rowId = row.id;

            // Validate chemical shift
            const shift = this.parseChemicalShift(row.shift);
            if (shift === null || row.shift.trim() === '') {
                this.appState.validation.setError(`shift-${rowId}`, 'Invalid chemical shift');
                hasErrors = true;
            }

            // Validate multiplicity (for 1H NMR)
            if (is1HNMR) {
                const multiplicity = this.convertMultiplicityToText(row.multiplicity);

                if (row.multiplicity.trim() === '') {
                    this.appState.validation.setError(`mult-${rowId}`, 'Multiplicity is required for 1H NMR');
                    hasErrors = true;
                } else {
                    try {
                        const multipletnumbers = (window as any).multipletnumbers;
                        multipletnumbers(multiplicity);
                    } catch (error) {
                        this.appState.validation.setError(`mult-${rowId}`, 'Invalid multiplicity');
                        hasErrors = true;
                    }
                }

                // Validate integration (for 1H NMR)
                if (!row.integration || row.integration === 0) {
                    this.appState.validation.setError(`int-${rowId}`, 'Integration is required for 1H NMR');
                    hasErrors = true;
                }
            }

            // Validate J-values
            const multiplicity = this.convertMultiplicityToText(row.multiplicity);
            const isJValuesOptional = (window as any).isJValuesOptional;
            const isOptional = multiplicity && isJValuesOptional(multiplicity);

            const requiredJCount = this.calculateRequiredJColumns(multiplicity);
            const actualJCount = row.jValues.filter(j => !isNaN(j) && j !== 0).length;

            if (isOptional) {
                // Optional: either all empty or all filled
                if (actualJCount > 0 && actualJCount < requiredJCount) {
                    for (let i = 0; i < requiredJCount; i++) {
                        if (!row.jValues[i] || row.jValues[i] === 0) {
                            this.appState.validation.setError(`j${i}-${rowId}`, 'All J-values must be filled');
                            hasErrors = true;
                        }
                    }
                }
            } else {
                // Not optional: all must be filled
                for (let i = 0; i < requiredJCount; i++) {
                    if (!row.jValues[i] || row.jValues[i] === 0) {
                        this.appState.validation.setError(`j${i}-${rowId}`, 'J-value is required');
                        hasErrors = true;
                    }
                }
            }
        });

        return hasErrors;
    }

    private parseChemicalShift(value: string): number | [number, number] | null {
        if (!value || value.trim() === '') return null;

        const trimmed = value.trim();

        // Check for range format (supports both hyphen and en-dash)
        const rangeMatch = trimmed.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
        if (rangeMatch) {
            const num1 = parseFloat(rangeMatch[1]);
            const num2 = parseFloat(rangeMatch[2]);
            if (!isNaN(num1) && !isNaN(num2)) {
                return [num1, num2];
            }
        }

        // Single value
        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
            return num;
        }

        return null;
    }

    private convertMultiplicityToText(input: string): string {
        if (!input || input.trim() === '') return '';

        const trimmed = input.trim();

        // Check if input is purely numeric
        if (/^\d+$/.test(trimmed)) {
            const digitMap: { [key: string]: string } = {
                '1': 's',
                '2': 'd',
                '3': 't',
                '4': 'q',
                '5': 'quint'
            };

            let result = '';
            for (const digit of trimmed) {
                if (digit >= '1' && digit <= '5') {
                    result += digitMap[digit];
                }
            }
            return result;
        }

        return trimmed;
    }

    private calculateRequiredJColumns(multiplicity: string): number {
        if (!multiplicity || multiplicity.trim() === '') {
            return 0;
        }

        try {
            const multipletnumbers = (window as any).multipletnumbers;
            const jCounts = multipletnumbers(multiplicity);
            if (jCounts === null) {
                return 0;
            }
            return jCounts.length;
        } catch {
            return 0;
        }
    }

    private sortPeaksByShift(peaks: NMRPeak[], order: 'asc' | 'desc'): void {
        peaks.sort((a, b) => {
            const aValue = this.getShiftValue(a.chemicalShift);
            const bValue = this.getShiftValue(b.chemicalShift);

            if (order === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }

    private getShiftValue(shift: number | [number, number]): number {
        if (Array.isArray(shift)) {
            return (shift[0] + shift[1]) / 2;
        }
        return shift;
    }

    private copyFormattedText(): void {
        const richTextContent = this.richTextEditor.getContent();

        if (!richTextContent || richTextContent.trim() === '') {
            alert('No formatted text to copy. Generate text first.');
            return;
        }

        // Create temporary element to copy HTML content
        const tempElement = document.createElement('div');
        tempElement.innerHTML = richTextContent;
        document.body.appendChild(tempElement);

        // Select the content
        const range = document.createRange();
        range.selectNodeContents(tempElement);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        try {
            // Copy to clipboard
            document.execCommand('copy');

            // Show feedback
            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                (copyBtn as HTMLButtonElement).style.backgroundColor = '#28a745';
                (copyBtn as HTMLButtonElement).style.color = 'white';

                setTimeout(() => {
                    copyBtn.textContent = originalText || 'Copy';
                    (copyBtn as HTMLButtonElement).style.backgroundColor = '';
                    (copyBtn as HTMLButtonElement).style.color = '';
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy to clipboard');
        } finally {
            // Clean up
            document.body.removeChild(tempElement);
            selection?.removeAllRanges();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    (window as any).app = new NMRFormatterApp();
    console.log('NMR Formatter App initialized (TypeScript version)');
});
