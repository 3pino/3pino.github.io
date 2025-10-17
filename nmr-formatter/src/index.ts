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
    extractNucleiHTMLFromText,
    extractSolventHTMLFromText,
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
    isTSVData,
    parseTSV
} from './utils/tsv-parser';

export {
    isTopSpinData,
    parseTopSpinDirectory,
    parseTopSpinXML,
    parseTopSpinMetadata
} from './utils/topspin-parser';

// Validators
export {
    filterNumericInput,
    filterHTMLTags,
    noFilter
} from './utils/validators/input-filters';

export {
    shiftValidator,
    multiplicityValidator,
    jValueValidator,
    integrationValidator,
    assignmentValidator,
    getValidator
} from './utils/validators/field-validators';

export type { FieldValidator, FieldValidationResult } from './utils/validators/field-validators';

// UI Components
export { ErrorNotification } from './ui/components/ErrorNotification';
export type { NotificationOptions } from './ui/components/ErrorNotification';
export { DragDropHandler } from './ui/components/DragDropHandler';
export type { DragDropOptions } from './ui/components/DragDropHandler';
export { NMRFormatterApp } from './ui/App';

// Re-export validation functions for backward compatibility
export const multipletnumbers = NMRPeak.multipletnumbers;
export const isJValuesOptional = NMRPeak.isJValuesOptional;

// Browser compatibility: Export to window object for non-module environments
import { LogLevel, Logger } from './core/logger';
import * as Constants from './core/constants';
import * as Models from './models/Metadata';
import { NMRPeak } from './models/NMRPeak';
import { NMRData } from './models/NMRData';
import * as Parser from './utils/parser';
import * as Formatter from './utils/formatter';
import * as TableConverter from './utils/table-converter';
import * as TSVParser from './utils/tsv-parser';
import * as TopSpinParser from './utils/topspin-parser';
import { ErrorNotification } from './ui/components/ErrorNotification';
import { DragDropHandler } from './ui/components/DragDropHandler';
import { NMRFormatterApp } from './ui/App';

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
    w.extractNucleiHTMLFromText = Constants.extractNucleiHTMLFromText;
    w.extractSolventHTMLFromText = Constants.extractSolventHTMLFromText;


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

    // TSV Parser
    w.isTSVData = TSVParser.isTSVData;
    w.parseTSV = TSVParser.parseTSV;

    // TopSpin Parser
    w.isTopSpinData = TopSpinParser.isTopSpinData;
    w.parseTopSpinDirectory = TopSpinParser.parseTopSpinDirectory;
    w.parseTopSpinXML = TopSpinParser.parseTopSpinXML;
    w.parseTopSpinMetadata = TopSpinParser.parseTopSpinMetadata;

    // Validators (from NMRPeak static methods)
    w.multipletnumbers = NMRPeak.multipletnumbers;
    w.isJValuesOptional = NMRPeak.isJValuesOptional;

    // UI Components
    w.ErrorNotification = ErrorNotification;
    w.DragDropHandler = DragDropHandler;
    w.NMRFormatterApp = NMRFormatterApp;
}
