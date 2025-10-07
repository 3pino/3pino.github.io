"use strict";
// NMR Text Parser
// Parses free-text NMR data into structured NMRData objects
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOLVENT_PATTERNS = exports.NUCLEI_PATTERNS = exports.NMR_PATTERNS = void 0;
exports.parseNMRText = parseNMRText;
exports.parseSinglePeak = parseSinglePeak;
exports.parseJValues = parseJValues;
exports.isMetadataSegment = isMetadataSegment;
const NMRPeak_1 = require("../models/NMRPeak");
const NMRData_1 = require("../models/NMRData");
const Metadata_1 = require("../models/Metadata");
const logger_1 = require("../core/logger");
const constants_1 = require("../core/constants");
// Import pattern functions
const NUCLEI_PATTERNS = (0, constants_1.getNucleiPatterns)();
exports.NUCLEI_PATTERNS = NUCLEI_PATTERNS;
const SOLVENT_PATTERNS = (0, constants_1.getSolventPatterns)();
exports.SOLVENT_PATTERNS = SOLVENT_PATTERNS;
// Regular expression patterns for parsing NMR data
const NMR_PATTERNS = {
    // Metadata patterns
    frequency: /(\d+(?:\.\d+)?)\s*MHz/i,
    // Delimiters for splitting segments (dynamic based on NMR type)
    segmentDelimiterProton: /[):]/, // For 1H NMR
    segmentDelimiterOther: /[):]/, // For 13C, 19F, etc.
    // Chemical shift patterns
    chemicalShiftRange: /^(-?\d+(?:\.\d+)?)\s*[-–—ー]\s*(-?\d+(?:\.\d+)?)$/,
    chemicalShiftSingle: /^(-?\d+(?:\.\d+)?)$/,
    // Multiplicity patterns - relaxed to accept various formats (actual validation in multipletnumbers())
    multiplicity: /^[a-zA-Z0-9\s\-]+$/,
    // Cleanup patterns (still needed for text cleaning)
    extraSpaces: /\s+/g,
    trailingCommas: /,\s*$/,
    leadingCommas: /^\s*,/
};
exports.NMR_PATTERNS = NMR_PATTERNS;
// Helper function to clean and normalize text
function cleanText(text) {
    return text
        .replace(NMR_PATTERNS.extraSpaces, ' ')
        .replace(NMR_PATTERNS.trailingCommas, '')
        .replace(NMR_PATTERNS.leadingCommas, '')
        .trim();
}
// Parse J-values from text like "5.2, 1.3hz" or "12.5 hz"
function parseJValues(jText) {
    if (!jText)
        return [];
    const cleanJ = cleanText(jText.replace(/hz?/i, ''));
    if (!cleanJ)
        return [];
    return cleanJ
        .split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));
}
// Parse individual peak using state-based token analysis
// Example: "δ 7.40(s, 1H)" -> tokens: ["δ", "7.40", "s", "1H"]
function parseSinglePeak(peakText, is1HNMR = true) {
    const cleanInput = cleanText(peakText);
    if (!cleanInput)
        return null;
    logger_1.Logger.debug('Parsing peak:', cleanInput, 'includeIntegral:', is1HNMR);
    // Split by parentheses, spaces, and commas
    const tokens = cleanInput.split(/[\(\)\s,]+/).filter(t => t.length > 0);
    logger_1.Logger.debug('Tokens:', tokens);
    if (tokens.length < 1) {
        logger_1.Logger.debug('No tokens found');
        return null;
    }
    // State variables
    let chemicalShift;
    let multiplicity = "";
    const jValues = [];
    let integration = 0;
    // Process each token with context awareness
    tokens.forEach((token, index) => {
        const isalmostLast = index === tokens.length - 1 || index === tokens.length - 2;
        const cleanToken = token.replace(/hz?$/i, ''); // Remove Hz suffix
        const isNumber = !isNaN(parseFloat(cleanToken));
        const isIntegrationPattern = /^\d+(H|C|N|F|Na|Al|Si|P)?$/i.test(token);
        const isMultiplicityPattern = NMR_PATTERNS.multiplicity.test(token);
        logger_1.Logger.debug(`Processing token "${token}" - isLast:${isalmostLast}, isNumber:${isNumber}, isIntegration:${isIntegrationPattern}, isMultiplicity:${isMultiplicityPattern}`);
        // Rule 1: Last token + not single token + 1H NMR + integration pattern = integration
        if (isalmostLast && tokens.length > 1 && isIntegrationPattern) {
            integration = parseInt(token.replace(/H$/i, ''));
            logger_1.Logger.debug('Set integration:', integration);
        }
        // Rule 2: Chemical shift (range or single) + no chemical shift defined = chemical shift
        else if (chemicalShift === undefined) {
            const rangeMatch = token.match(NMR_PATTERNS.chemicalShiftRange);
            const singleMatch = cleanToken.match(NMR_PATTERNS.chemicalShiftSingle);
            if (rangeMatch) {
                const start = parseFloat(rangeMatch[1]);
                const end = parseFloat(rangeMatch[2]);
                chemicalShift = [start, end];
                logger_1.Logger.debug('Set chemical shift range:', chemicalShift);
            }
            else if (singleMatch && isNumber) {
                chemicalShift = parseFloat(singleMatch[1]);
                logger_1.Logger.debug('Set chemical shift:', chemicalShift);
            }
        }
        // Rule 3: Number + chemical shift already defined = J value
        else if (isNumber && chemicalShift !== undefined) {
            jValues.push(parseFloat(cleanToken));
            logger_1.Logger.debug('Added J value:', parseFloat(cleanToken));
        }
        // Rule 4: Multiplicity pattern + chemical shift defined + multiplicity not set = multiplicity
        else if (isMultiplicityPattern && chemicalShift !== undefined && multiplicity === "") {
            multiplicity = token;
            logger_1.Logger.debug('Set multiplicity:', multiplicity);
        }
        else {
            logger_1.Logger.debug('Token ignored:', token);
        }
    });
    // Validation: chemical shift is required
    if (chemicalShift === undefined) {
        logger_1.Logger.debug('No chemical shift found, returning null');
        return null;
    }
    logger_1.Logger.debug('Final values - shift:', chemicalShift, 'mult:', multiplicity, 'jValues:', jValues, 'integration:', integration);
    return new NMRPeak_1.NMRPeak(chemicalShift, multiplicity, jValues, integration);
}
// Helper function to check if a segment contains metadata
function isMetadataSegment(text) {
    return Object.values(SOLVENT_PATTERNS).some(pattern => pattern.test(text)) ||
        Object.values(NUCLEI_PATTERNS).some(pattern => pattern.test(text));
}
// Main parsing function
function parseNMRText(text) {
    const cleanInput = cleanText(text);
    logger_1.Logger.debug('Input text:', cleanInput);
    const allMetadataText = cleanInput;
    const nuclei = (0, constants_1.extractNucleiFromText)(allMetadataText);
    const solvent = (0, constants_1.extractSolventFromText)(allMetadataText);
    const frequencyMatch = allMetadataText.match(NMR_PATTERNS.frequency);
    const metadata = new Metadata_1.Metadata(nuclei, solvent, frequencyMatch ? parseFloat(frequencyMatch[1]) : NaN);
    const is1HNMR = nuclei === "1H" || nuclei === "";
    // Phase 1: Split by appropriate delimiters based on NMR type
    const delimiter = is1HNMR ? NMR_PATTERNS.segmentDelimiterProton : NMR_PATTERNS.segmentDelimiterOther;
    const rawSegments = cleanInput.split(delimiter);
    logger_1.Logger.debug('Raw segments after splitting:', rawSegments);
    // Phase 2: Filter out empty/invalid segments and metadata segments
    const validSegments = [];
    const metadataText = [];
    rawSegments.forEach(segment => {
        const trimmed = segment.trim();
        if (trimmed.length > 2) {
            if (isMetadataSegment(trimmed)) {
                metadataText.push(trimmed);
                logger_1.Logger.debug('Metadata segment detected:', trimmed);
            }
            else {
                validSegments.push(trimmed);
                logger_1.Logger.debug('Valid peak segment:', trimmed);
            }
        }
    });
    // Phase 3: Parse each valid segment as a peak
    const peaks = [];
    logger_1.Logger.debug('Include integral based on parameter:', is1HNMR);
    validSegments.forEach(segment => {
        const peak = parseSinglePeak(segment, is1HNMR);
        if (peak) {
            peaks.push(peak);
            logger_1.Logger.debug('Parsed peak:', peak);
        }
        else {
            logger_1.Logger.debug('Failed to parse segment as peak:', segment);
        }
    });
    logger_1.Logger.debug('Final metadata:', metadata);
    logger_1.Logger.debug('Final peaks:', peaks);
    return new NMRData_1.NMRData(peaks, metadata);
}
//# sourceMappingURL=parser.js.map