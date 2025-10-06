// Main entry point for NMR Formatter library
// Exports all public APIs

// Core types and constants
export * from './core/types';
export * from './core/logger';
export {
    NUCLEI_CONFIG,
    SOLVENT_CONFIG,
    getNucleiPatterns,
    getSolventPatterns,
    extractNucleiFromText,
    extractSolventFromText,
    isValidNucleiType,
    isValidSolventType
} from './core/constants';

// Models
export { Metadata, validateNucleiType, validateSolventType } from './models/Metadata';
export { NMRPeak } from './models/NMRPeak';
export { NMRData } from './models/NMRData';

// Utilities
export {
    parseNMRText,
    NMR_PATTERNS,
    NUCLEI_PATTERNS,
    SOLVENT_PATTERNS,
    parseSinglePeak,
    parseJValues,
    isMetadataSegment
} from './utils/parser';

export {
    generateFormattedText,
    formatChemicalShift,
    formatJValues,
    formatIntegration,
    formatMultiplicity,
    formatSinglePeak,
    formatMetadata
} from './utils/formatter';

export {
    dataToTable,
    tableToData,
    getMaxJValues
} from './utils/table-converter';

export {
    multipletnumbers,
    isJValuesOptional,
    validateNMRData,
    validateNMRPeak,
    validateRichTextContent
} from './utils/validators';

// Browser compatibility: Export to window object for non-module environments
import { LogLevel, Logger } from './core/logger';
import * as Constants from './core/constants';
import * as Models from './models/Metadata';
import { NMRPeak } from './models/NMRPeak';
import { NMRData } from './models/NMRData';
import * as Parser from './utils/parser';
import * as Formatter from './utils/formatter';
import * as TableConverter from './utils/table-converter';
import * as Validators from './utils/validators';

if (typeof window !== 'undefined') {
    const w = window as any;

    // Core
    w.LogLevel = LogLevel;
    w.Logger = Logger;

    // Models
    w.Metadata = Models.Metadata;
    w.NMRPeak = NMRPeak;
    w.NMRData = NMRData;
    w.validateNucleiType = Models.validateNucleiType;
    w.validateSolventType = Models.validateSolventType;

    // Constants
    w.extractNucleiFromText = Constants.extractNucleiFromText;
    w.extractSolventFromText = Constants.extractSolventFromText;

    // Parser
    w.parseNMRText = Parser.parseNMRText;
    w.NMR_PATTERNS = Parser.NMR_PATTERNS;
    w.NUCLEI_PATTERNS = Parser.NUCLEI_PATTERNS;
    w.SOLVENT_PATTERNS = Parser.SOLVENT_PATTERNS;
    w.parseSinglePeak = Parser.parseSinglePeak;
    w.parseJValues = Parser.parseJValues;
    w.isMetadataSegment = Parser.isMetadataSegment;

    // Formatter
    w.generateFormattedText = Formatter.generateFormattedText;
    w.formatChemicalShift = Formatter.formatChemicalShift;
    w.formatJValues = Formatter.formatJValues;
    w.formatIntegration = Formatter.formatIntegration;
    w.formatMultiplicity = Formatter.formatMultiplicity;
    w.formatSinglePeak = Formatter.formatSinglePeak;
    w.formatMetadata = Formatter.formatMetadata;

    // Table converter
    w.dataToTable = TableConverter.dataToTable;
    w.tableToData = TableConverter.tableToData;
    w.getMaxJValues = TableConverter.getMaxJValues;

    // Validators
    w.multipletnumbers = Validators.multipletnumbers;
    w.isJValuesOptional = Validators.isJValuesOptional;
    w.validateNMRData = Validators.validateNMRData;
    w.validateNMRPeak = Validators.validateNMRPeak;
    w.validateRichTextContent = Validators.validateRichTextContent;
}
