/**
 * Main Application
 * Orchestrates all components and manages application lifecycle
 */

import { AppState } from '../state/AppState';
import { MetadataForm } from './components/MetadataForm';
import { NMRTable } from './components/NMRTable';
import { RichTextEditor } from './components/RichTextEditor';
import { Toolbar } from './components/Toolbar';
import { ErrorNotification } from './components/ErrorNotification';
import { DragDropHandler } from './components/DragDropHandler';
import { isTopSpinData, parseTopSpinDirectory, parseTopSpinMetadata } from '../utils/topspin-parser';
import { FocusManager } from './navigation/FocusManager';
import { parseChemicalShift, convertMultiplicityToText } from '../utils/conversion';
import { sortPeaksByShift } from '../utils/sorting';
import { validateMetadata, validateTableRows } from '../utils/form-validation';
import { generateFormattedText } from '../utils/formatter';

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
    private errorNotification: ErrorNotification;
    private dragDropHandler?: DragDropHandler;

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
            },
            () => {
                // Regenerate formatted text when sort order changes
                this.generateFormattedText();
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

        // Initialize error notification system
        this.errorNotification = new ErrorNotification();

        // Initialize drag-drop handler for table container
        const tableContainer = document.querySelector('.table-container') as HTMLElement;
        if (tableContainer) {
            this.dragDropHandler = new DragDropHandler({
                targetElement: tableContainer,
                errorNotification: this.errorNotification,
                onFilesDropped: async (files) => {
                    console.log('Files dropped:', files.map(f => f.name));
                    await this.handleTopSpinImport(files);
                }
            });
        }

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
            // Get metadata
            const metadataData = this.appState.metadata.getData();
            const metadata = new Metadata(
                metadataData.nuclei as any, // HTML content as nuclei type
                metadataData.solvent as any, // HTML content as solvent type
                metadataData.frequency
            );

            // Sort all J-values in descending order
            this.appState.table.sortAllJValues();

            // Remove empty rows from table
            this.appState.table.removeEmptyRows();

            // Validate and highlight errors (after removing empty rows)
            const hasErrors = this.validateAndHighlightTable();

            // Get peaks from table state
            const tableRows = this.appState.table.getRows();
            const peaks: NMRPeak[] = [];

            tableRows.forEach(row => {
                const shift = parseChemicalShift(row.shift);
                const multiplicity = convertMultiplicityToText(row.multiplicity);

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
            sortPeaksByShift(peaks, metadataData.sortOrder);

            const nmrData = new NMRData(peaks, metadata);

            // Generate formatted text
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
        hasErrors = validateMetadata(
            {
                nuclei: metadataData.nuclei,
                solvent: metadataData.solvent,
                frequency: metadataData.frequency
            },
            this.appState.validation
        );

        // Validate table rows
        const tableRows = this.appState.table.getRows();
        const is1HNMR = metadataData.nuclei.includes('1') && metadataData.nuclei.includes('H');
        
        if (validateTableRows(tableRows, is1HNMR, this.appState.validation)) {
            hasErrors = true;
        }

        return hasErrors;
    }


    /**
     * Handle TopSpin data import
     * @param files - Array of files from drag-and-drop
     */
    private async handleTopSpinImport(files: File[]): Promise<void> {
        try {
            // Check if files contain TopSpin data
            if (!isTopSpinData(files)) {
                console.log('Not TopSpin data');
                return;
            }

            // Parse TopSpin directory to extract peaks and metadata
            const peaks = await parseTopSpinDirectory(files);
            
            if (peaks.length === 0) {
                this.errorNotification.show({
                    message: 'No peaks found in TopSpin data.',
                    duration: 5000
                });
                return;
            }

            // Extract metadata from parm.txt
            const parmFile = files.find(f => f.name === 'parm.txt');
            if (parmFile) {
                const parmContent = await parmFile.text();
                const metadata = parseTopSpinMetadata(parmContent);
                
                // Update metadata state
                if (metadata.nuclei) {
                    this.appState.metadata.setNuclei(metadata.nuclei);
                }
                if (metadata.solvent) {
                    this.appState.metadata.setSolvent(metadata.solvent);
                }
                if (metadata.frequency) {
                    this.appState.metadata.setFrequency(metadata.frequency);
                }
                
                // Update form fields from state
                this.metadataForm.updateFromState();
            }

            // Sort peaks by chemical shift (descending order - high to low ppm)
            sortPeaksByShift(peaks, 'desc');

            // Clear existing rows and add new peaks
            // Remove all existing rows
            const existingRows = this.appState.table.getRows();
            this.appState.table.removeRows(existingRows.map(row => row.id));

            // Add each peak as a new row
            peaks.forEach(peak => {
                this.appState.table.addRow({
                    shift: peak.shift.toString(),
                    multiplicity: peak.multiplicity,
                    jValues: peak.jValues,
                    integration: typeof peak.integration === 'number' ? peak.integration : parseFloat(peak.integration),
                    assignment: peak.assignment
                });
            });

            // Remove any empty rows (including the initial empty row)
            this.appState.table.removeEmptyRows();

            // Don't auto-generate formatted text - let user review and edit first
            // this.generateFormattedText();

            console.log(`Successfully imported ${peaks.length} peaks from TopSpin data`);
        } catch (error) {
            console.error('Error importing TopSpin data:', error);
            this.errorNotification.show({
                message: 'Error importing TopSpin data. Please try again.',
                duration: 5000
            });
        }
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
