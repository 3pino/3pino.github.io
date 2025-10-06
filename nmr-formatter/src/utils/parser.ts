// NMR Text Parser
// Parses free-text NMR data into structured NMRData objects

import { NMRPeak } from '../models/NMRPeak';
import { NMRData } from '../models/NMRData';
import { Metadata } from '../models/Metadata';
import { Logger } from '../core/logger';
import {
    getNucleiPatterns,
    getSolventPatterns,
    extractNucleiFromText,
    extractSolventFromText
} from '../core/constants';

// Import pattern functions
const NUCLEI_PATTERNS = getNucleiPatterns();
const SOLVENT_PATTERNS = getSolventPatterns();

// Regular expression patterns for parsing NMR data
const NMR_PATTERNS = {
    // Metadata patterns
    frequency: /(\d+(?:\.\d+)?)\s*MHz/i,

    // Delimiters for splitting segments (dynamic based on NMR type)
    segmentDelimiterProton: /[):]/,  // For 1H NMR
    segmentDelimiterOther: /[):]/,      // For 13C, 19F, etc.

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

// Helper function to clean and normalize text
function cleanText(text: string): string {
    return text
        .replace(NMR_PATTERNS.extraSpaces, ' ')
        .replace(NMR_PATTERNS.trailingCommas, '')
        .replace(NMR_PATTERNS.leadingCommas, '')
        .trim();
}

// Parse J-values from text like "5.2, 1.3hz" or "12.5 hz"
function parseJValues(jText: string): number[] {
    if (!jText) return [];

    const cleanJ = cleanText(jText.replace(/hz?/i, ''));
    if (!cleanJ) return [];

    return cleanJ
        .split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));
}

// Parse individual peak using state-based token analysis
// Example: "δ 7.40(s, 1H)" -> tokens: ["δ", "7.40", "s", "1H"]
function parseSinglePeak(peakText: string, is1HNMR: boolean = true): NMRPeak | null {
    const cleanInput = cleanText(peakText);
    if (!cleanInput) return null;

    Logger.debug('Parsing peak:', cleanInput, 'includeIntegral:', is1HNMR);

    // Split by parentheses, spaces, and commas
    const tokens = cleanInput.split(/[\(\)\s,]+/).filter(t => t.length > 0);
    Logger.debug('Tokens:', tokens);

    if (tokens.length < 1) {
        Logger.debug('No tokens found');
        return null;
    }


    // State variables
    let chemicalShift: number | [number, number] | undefined;
    let multiplicity = "";
    const jValues: number[] = [];
    let integration = 0;

    // Process each token with context awareness
    tokens.forEach((token, index) => {
        const isalmostLast = index === tokens.length - 1 || index === tokens.length - 2;
        const cleanToken = token.replace(/hz?$/i, '');  // Remove Hz suffix
        const isNumber = !isNaN(parseFloat(cleanToken));
        const isIntegrationPattern = /^\d+(H|C|N|F|Na|Al|Si|P)?$/i.test(token);
        const isMultiplicityPattern = NMR_PATTERNS.multiplicity.test(token);

        Logger.debug(`Processing token "${token}" - isLast:${isalmostLast}, isNumber:${isNumber}, isIntegration:${isIntegrationPattern}, isMultiplicity:${isMultiplicityPattern}`);

        // Rule 1: Last token + not single token + 1H NMR + integration pattern = integration
        if (isalmostLast && tokens.length > 1 && isIntegrationPattern) {
            integration = parseInt(token.replace(/H$/i, ''));
            Logger.debug('Set integration:', integration);
        }
        // Rule 2: Chemical shift (range or single) + no chemical shift defined = chemical shift
        else if (chemicalShift === undefined) {
            const rangeMatch = token.match(NMR_PATTERNS.chemicalShiftRange);
            const singleMatch = cleanToken.match(NMR_PATTERNS.chemicalShiftSingle);

            if (rangeMatch) {
                const start = parseFloat(rangeMatch[1]);
                const end = parseFloat(rangeMatch[2]);
                chemicalShift = [start, end];
                Logger.debug('Set chemical shift range:', chemicalShift);
            } else if (singleMatch && isNumber) {
                chemicalShift = parseFloat(singleMatch[1]);
                Logger.debug('Set chemical shift:', chemicalShift);
            }
        }
        // Rule 3: Number + chemical shift already defined = J value
        else if (isNumber && chemicalShift !== undefined) {
            jValues.push(parseFloat(cleanToken));
            Logger.debug('Added J value:', parseFloat(cleanToken));
        }
        // Rule 4: Multiplicity pattern + chemical shift defined + multiplicity not set = multiplicity
        else if (isMultiplicityPattern && chemicalShift !== undefined && multiplicity === "") {
            multiplicity = token;
            Logger.debug('Set multiplicity:', multiplicity);
        }
        else {
            Logger.debug('Token ignored:', token);
        }
    });

    // Validation: chemical shift is required
    if (chemicalShift === undefined) {
        Logger.debug('No chemical shift found, returning null');
        return null;
    }

    Logger.debug('Final values - shift:', chemicalShift, 'mult:', multiplicity, 'jValues:', jValues, 'integration:', integration);

    return new NMRPeak(chemicalShift, multiplicity, jValues, integration);
}

// Helper function to check if a segment contains metadata
function isMetadataSegment(text: string): boolean {
    return Object.values(SOLVENT_PATTERNS).some(pattern => pattern.test(text)) ||
           Object.values(NUCLEI_PATTERNS).some(pattern => pattern.test(text));
}

// Main parsing function
export function parseNMRText(text: string): NMRData {
    const cleanInput = cleanText(text);
    Logger.debug('Input text:', cleanInput);

    const allMetadataText = cleanInput;
    const nuclei = extractNucleiFromText(allMetadataText);
    const solvent = extractSolventFromText(allMetadataText);
    const frequencyMatch = allMetadataText.match(NMR_PATTERNS.frequency);

    const metadata: Metadata = new Metadata(
        nuclei,
        solvent,
        frequencyMatch ? parseFloat(frequencyMatch[1]) : NaN
    );

    const is1HNMR = nuclei === "1H" || nuclei === "";

    // Phase 1: Split by appropriate delimiters based on NMR type
    const delimiter = is1HNMR ? NMR_PATTERNS.segmentDelimiterProton : NMR_PATTERNS.segmentDelimiterOther;
    const rawSegments = cleanInput.split(delimiter);
    Logger.debug('Raw segments after splitting:', rawSegments);

    // Phase 2: Filter out empty/invalid segments and metadata segments
    const validSegments: string[] = [];
    const metadataText: string[] = [];

    rawSegments.forEach(segment => {
        const trimmed = segment.trim();
        if (trimmed.length > 2) {
            if (isMetadataSegment(trimmed)) {
                metadataText.push(trimmed);
                Logger.debug('Metadata segment detected:', trimmed);
            } else {
                validSegments.push(trimmed);
                Logger.debug('Valid peak segment:', trimmed);
            }
        }
    });

    // Phase 3: Parse each valid segment as a peak
    const peaks: NMRPeak[] = [];
    Logger.debug('Include integral based on parameter:', is1HNMR);

    validSegments.forEach(segment => {
        const peak = parseSinglePeak(segment, is1HNMR);
        if (peak) {
            peaks.push(peak);
            Logger.debug('Parsed peak:', peak);
        } else {
            Logger.debug('Failed to parse segment as peak:', segment);
        }
    });

    Logger.debug('Final metadata:', metadata);
    Logger.debug('Final peaks:', peaks);

    return new NMRData(peaks, metadata);
}

// Export parsing patterns and helper functions
export { NMR_PATTERNS, NUCLEI_PATTERNS, SOLVENT_PATTERNS, parseSinglePeak, parseJValues, isMetadataSegment };
