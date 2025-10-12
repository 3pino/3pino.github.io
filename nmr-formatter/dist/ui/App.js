"use strict";
/**
 * Main Application
 * Orchestrates all components and manages application lifecycle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NMRFormatterApp = void 0;
const AppState_1 = require("../state/AppState");
const MetadataForm_1 = require("./components/MetadataForm");
const NMRTable_1 = require("./components/NMRTable");
const RichTextEditor_1 = require("./components/RichTextEditor");
const Toolbar_1 = require("./components/Toolbar");
const FocusManager_1 = require("./navigation/FocusManager");
const conversion_1 = require("../utils/conversion");
const sorting_1 = require("../utils/sorting");
const form_validation_1 = require("../utils/form-validation");
// Import from existing modules
const Metadata_1 = require("../models/Metadata");
const NMRPeak_1 = require("../models/NMRPeak");
const NMRData_1 = require("../models/NMRData");
class NMRFormatterApp {
    constructor() {
        this.appState = new AppState_1.AppState();
        // Initialize focus manager
        this.focusManager = new FocusManager_1.FocusManager([], () => {
            const firstInput = this.nmrTable.getFirstInput();
            firstInput === null || firstInput === void 0 ? void 0 : firstInput.focus();
        });
        // Initialize metadata form
        this.metadataForm = new MetadataForm_1.MetadataForm(this.appState.metadata, this.appState.validation, (currentField, reverse) => {
            this.focusManager.focusNextMetadataField(currentField, reverse);
        }, () => {
            // Regenerate formatted text when sort order changes
            this.generateFormattedText();
        });
        // Update focus manager with metadata fields
        this.focusManager = new FocusManager_1.FocusManager(this.metadataForm.getFieldOrder(), () => {
            const firstInput = this.nmrTable.getFirstInput();
            firstInput === null || firstInput === void 0 ? void 0 : firstInput.focus();
        });
        // Initialize NMR table
        this.nmrTable = new NMRTable_1.NMRTable(this.appState.table, this.appState.validation, () => {
            // On multiplicity change
            this.appState.validation.clearAllErrors();
        }, (reverse) => {
            var _a;
            // On navigate to metadata
            const fields = this.metadataForm.getFieldOrder();
            if (reverse) {
                (_a = fields[fields.length - 1]) === null || _a === void 0 ? void 0 : _a.focus();
            }
        });
        // Initialize rich text editor
        this.richTextEditor = new RichTextEditor_1.RichTextEditor();
        // Initialize toolbar
        this.toolbar = new Toolbar_1.Toolbar();
        // Initialize event listeners
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        // Convert down button (Table → Rich Text)
        const convertDownBtn = document.getElementById('convert-down-btn');
        convertDownBtn === null || convertDownBtn === void 0 ? void 0 : convertDownBtn.addEventListener('click', () => {
            this.generateFormattedText();
        });
        // Copy button
        const copyBtn = document.getElementById('copy-btn');
        copyBtn === null || copyBtn === void 0 ? void 0 : copyBtn.addEventListener('click', () => {
            this.copyFormattedText();
        });
    }
    generateFormattedText() {
        try {
            // Get metadata
            const metadataData = this.appState.metadata.getData();
            const metadata = new Metadata_1.Metadata(metadataData.nuclei, // HTML content as nuclei type
            metadataData.solvent, // HTML content as solvent type
            metadataData.frequency);
            // Sort all J-values in descending order
            this.appState.table.sortAllJValues();
            // Remove empty rows from table
            this.appState.table.removeEmptyRows();
            // Validate and highlight errors (after removing empty rows)
            const hasErrors = this.validateAndHighlightTable();
            // Get peaks from table state
            const tableRows = this.appState.table.getRows();
            const peaks = [];
            tableRows.forEach(row => {
                const shift = (0, conversion_1.parseChemicalShift)(row.shift);
                const multiplicity = (0, conversion_1.convertMultiplicityToText)(row.multiplicity);
                if (shift !== null) {
                    const peak = new NMRPeak_1.NMRPeak(shift, multiplicity, row.jValues, row.integration, row.assignment);
                    peaks.push(peak);
                }
            });
            if (peaks.length === 0) {
                this.richTextEditor.showPlaceholder();
                return;
            }
            // Sort peaks by chemical shift
            (0, sorting_1.sortPeaksByShift)(peaks, metadataData.sortOrder);
            const nmrData = new NMRData_1.NMRData(peaks, metadata);
            // Generate formatted text
            const generateFormattedText = window.generateFormattedText;
            const formattedText = generateFormattedText(nmrData, metadataData.shiftPrecision, metadataData.jPrecision, 0);
            this.richTextEditor.setContent(formattedText);
            if (hasErrors) {
                console.log('Generated text with validation errors present');
            }
        }
        catch (error) {
            console.error('Error generating formatted text:', error);
            this.richTextEditor.showError(error.message);
        }
    }
    validateAndHighlightTable() {
        let hasErrors = false;
        // Validate metadata
        const metadataData = this.appState.metadata.getData();
        hasErrors = (0, form_validation_1.validateMetadata)({
            nuclei: metadataData.nuclei,
            solvent: metadataData.solvent,
            frequency: metadataData.frequency
        }, this.appState.validation);
        // Validate table rows
        const tableRows = this.appState.table.getRows();
        const is1HNMR = metadataData.nuclei.includes('1') && metadataData.nuclei.includes('H');
        if ((0, form_validation_1.validateTableRows)(tableRows, is1HNMR, this.appState.validation)) {
            hasErrors = true;
        }
        return hasErrors;
    }
    copyFormattedText() {
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
        selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
        selection === null || selection === void 0 ? void 0 : selection.addRange(range);
        try {
            // Copy to clipboard
            document.execCommand('copy');
            // Show feedback
            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#28a745';
                copyBtn.style.color = 'white';
                setTimeout(() => {
                    copyBtn.textContent = originalText || 'Copy';
                    copyBtn.style.backgroundColor = '';
                    copyBtn.style.color = '';
                }, 2000);
            }
        }
        catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy to clipboard');
        }
        finally {
            // Clean up
            document.body.removeChild(tempElement);
            selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
        }
    }
}
exports.NMRFormatterApp = NMRFormatterApp;
// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NMRFormatterApp();
    console.log('NMR Formatter App initialized (TypeScript version)');
});
//# sourceMappingURL=App.js.map