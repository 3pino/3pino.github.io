"use strict";
// Main entry point for NMR Formatter library
// Exports all public APIs
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJValuesOptional = exports.multipletnumbers = exports.NMRFormatterApp = exports.DragDropHandler = exports.ErrorNotification = exports.getValidator = exports.assignmentValidator = exports.integrationValidator = exports.jValueValidator = exports.multiplicityValidator = exports.shiftValidator = exports.noFilter = exports.filterHTMLTags = exports.filterNumericInput = exports.parseTSV = exports.isTSVData = exports.getMaxJValues = exports.tableToData = exports.dataToTable = exports.formatMetadata = exports.formatSinglePeak = exports.formatMultiplicity = exports.formatIntegration = exports.formatJValues = exports.formatChemicalShift = exports.generateFormattedText = exports.isMetadataSegment = exports.parseJValues = exports.parseSinglePeak = exports.SOLVENT_PATTERNS = exports.NUCLEI_PATTERNS = exports.NMR_PATTERNS = exports.parseNMRText = exports.NMRData = exports.NMRPeak = exports.validateSolventType = exports.validateNucleiType = exports.Metadata = exports.isValidSolventType = exports.isValidNucleiType = exports.extractSolventFromText = exports.extractNucleiFromText = exports.getSolventPatterns = exports.getNucleiPatterns = exports.SOLVENT_CONFIG = exports.NUCLEI_CONFIG = void 0;
// Core types and constants
__exportStar(require("./core/types"), exports);
__exportStar(require("./core/logger"), exports);
var constants_1 = require("./core/constants");
Object.defineProperty(exports, "NUCLEI_CONFIG", { enumerable: true, get: function () { return constants_1.NUCLEI_CONFIG; } });
Object.defineProperty(exports, "SOLVENT_CONFIG", { enumerable: true, get: function () { return constants_1.SOLVENT_CONFIG; } });
Object.defineProperty(exports, "getNucleiPatterns", { enumerable: true, get: function () { return constants_1.getNucleiPatterns; } });
Object.defineProperty(exports, "getSolventPatterns", { enumerable: true, get: function () { return constants_1.getSolventPatterns; } });
Object.defineProperty(exports, "extractNucleiFromText", { enumerable: true, get: function () { return constants_1.extractNucleiFromText; } });
Object.defineProperty(exports, "extractSolventFromText", { enumerable: true, get: function () { return constants_1.extractSolventFromText; } });
Object.defineProperty(exports, "isValidNucleiType", { enumerable: true, get: function () { return constants_1.isValidNucleiType; } });
Object.defineProperty(exports, "isValidSolventType", { enumerable: true, get: function () { return constants_1.isValidSolventType; } });
// Models
var Metadata_1 = require("./models/Metadata");
Object.defineProperty(exports, "Metadata", { enumerable: true, get: function () { return Metadata_1.Metadata; } });
Object.defineProperty(exports, "validateNucleiType", { enumerable: true, get: function () { return Metadata_1.validateNucleiType; } });
Object.defineProperty(exports, "validateSolventType", { enumerable: true, get: function () { return Metadata_1.validateSolventType; } });
var NMRPeak_1 = require("./models/NMRPeak");
Object.defineProperty(exports, "NMRPeak", { enumerable: true, get: function () { return NMRPeak_1.NMRPeak; } });
var NMRData_1 = require("./models/NMRData");
Object.defineProperty(exports, "NMRData", { enumerable: true, get: function () { return NMRData_1.NMRData; } });
// Utilities
var parser_1 = require("./utils/parser");
Object.defineProperty(exports, "parseNMRText", { enumerable: true, get: function () { return parser_1.parseNMRText; } });
Object.defineProperty(exports, "NMR_PATTERNS", { enumerable: true, get: function () { return parser_1.NMR_PATTERNS; } });
Object.defineProperty(exports, "NUCLEI_PATTERNS", { enumerable: true, get: function () { return parser_1.NUCLEI_PATTERNS; } });
Object.defineProperty(exports, "SOLVENT_PATTERNS", { enumerable: true, get: function () { return parser_1.SOLVENT_PATTERNS; } });
Object.defineProperty(exports, "parseSinglePeak", { enumerable: true, get: function () { return parser_1.parseSinglePeak; } });
Object.defineProperty(exports, "parseJValues", { enumerable: true, get: function () { return parser_1.parseJValues; } });
Object.defineProperty(exports, "isMetadataSegment", { enumerable: true, get: function () { return parser_1.isMetadataSegment; } });
var formatter_1 = require("./utils/formatter");
Object.defineProperty(exports, "generateFormattedText", { enumerable: true, get: function () { return formatter_1.generateFormattedText; } });
Object.defineProperty(exports, "formatChemicalShift", { enumerable: true, get: function () { return formatter_1.formatChemicalShift; } });
Object.defineProperty(exports, "formatJValues", { enumerable: true, get: function () { return formatter_1.formatJValues; } });
Object.defineProperty(exports, "formatIntegration", { enumerable: true, get: function () { return formatter_1.formatIntegration; } });
Object.defineProperty(exports, "formatMultiplicity", { enumerable: true, get: function () { return formatter_1.formatMultiplicity; } });
Object.defineProperty(exports, "formatSinglePeak", { enumerable: true, get: function () { return formatter_1.formatSinglePeak; } });
Object.defineProperty(exports, "formatMetadata", { enumerable: true, get: function () { return formatter_1.formatMetadata; } });
var table_converter_1 = require("./utils/table-converter");
Object.defineProperty(exports, "dataToTable", { enumerable: true, get: function () { return table_converter_1.dataToTable; } });
Object.defineProperty(exports, "tableToData", { enumerable: true, get: function () { return table_converter_1.tableToData; } });
Object.defineProperty(exports, "getMaxJValues", { enumerable: true, get: function () { return table_converter_1.getMaxJValues; } });
var tsv_parser_1 = require("./utils/tsv-parser");
Object.defineProperty(exports, "isTSVData", { enumerable: true, get: function () { return tsv_parser_1.isTSVData; } });
Object.defineProperty(exports, "parseTSV", { enumerable: true, get: function () { return tsv_parser_1.parseTSV; } });
// Validators
var input_filters_1 = require("./utils/validators/input-filters");
Object.defineProperty(exports, "filterNumericInput", { enumerable: true, get: function () { return input_filters_1.filterNumericInput; } });
Object.defineProperty(exports, "filterHTMLTags", { enumerable: true, get: function () { return input_filters_1.filterHTMLTags; } });
Object.defineProperty(exports, "noFilter", { enumerable: true, get: function () { return input_filters_1.noFilter; } });
var field_validators_1 = require("./utils/validators/field-validators");
Object.defineProperty(exports, "shiftValidator", { enumerable: true, get: function () { return field_validators_1.shiftValidator; } });
Object.defineProperty(exports, "multiplicityValidator", { enumerable: true, get: function () { return field_validators_1.multiplicityValidator; } });
Object.defineProperty(exports, "jValueValidator", { enumerable: true, get: function () { return field_validators_1.jValueValidator; } });
Object.defineProperty(exports, "integrationValidator", { enumerable: true, get: function () { return field_validators_1.integrationValidator; } });
Object.defineProperty(exports, "assignmentValidator", { enumerable: true, get: function () { return field_validators_1.assignmentValidator; } });
Object.defineProperty(exports, "getValidator", { enumerable: true, get: function () { return field_validators_1.getValidator; } });
// UI Components
var ErrorNotification_1 = require("./ui/components/ErrorNotification");
Object.defineProperty(exports, "ErrorNotification", { enumerable: true, get: function () { return ErrorNotification_1.ErrorNotification; } });
var DragDropHandler_1 = require("./ui/components/DragDropHandler");
Object.defineProperty(exports, "DragDropHandler", { enumerable: true, get: function () { return DragDropHandler_1.DragDropHandler; } });
var App_1 = require("./ui/App");
Object.defineProperty(exports, "NMRFormatterApp", { enumerable: true, get: function () { return App_1.NMRFormatterApp; } });
// Re-export validation functions for backward compatibility
exports.multipletnumbers = NMRPeak_2.NMRPeak.multipletnumbers;
exports.isJValuesOptional = NMRPeak_2.NMRPeak.isJValuesOptional;
// Browser compatibility: Export to window object for non-module environments
const logger_1 = require("./core/logger");
const Constants = __importStar(require("./core/constants"));
const Models = __importStar(require("./models/Metadata"));
const NMRPeak_2 = require("./models/NMRPeak");
const NMRData_2 = require("./models/NMRData");
const Parser = __importStar(require("./utils/parser"));
const Formatter = __importStar(require("./utils/formatter"));
const TableConverter = __importStar(require("./utils/table-converter"));
const TSVParser = __importStar(require("./utils/tsv-parser"));
const ErrorNotification_2 = require("./ui/components/ErrorNotification");
const DragDropHandler_2 = require("./ui/components/DragDropHandler");
const App_2 = require("./ui/App");
if (typeof window !== 'undefined') {
    const w = window;
    // Core
    w.LogLevel = logger_1.LogLevel;
    w.Logger = logger_1.Logger;
    // Models
    w.Metadata = Models.Metadata;
    w.NMRPeak = NMRPeak_2.NMRPeak;
    w.NMRData = NMRData_2.NMRData;
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
    // TSV Parser
    w.isTSVData = TSVParser.isTSVData;
    w.parseTSV = TSVParser.parseTSV;
    // Validators (from NMRPeak static methods)
    w.multipletnumbers = NMRPeak_2.NMRPeak.multipletnumbers;
    w.isJValuesOptional = NMRPeak_2.NMRPeak.isJValuesOptional;
    // UI Components
    w.ErrorNotification = ErrorNotification_2.ErrorNotification;
    w.DragDropHandler = DragDropHandler_2.DragDropHandler;
    w.NMRFormatterApp = App_2.NMRFormatterApp;
}
//# sourceMappingURL=index.js.map