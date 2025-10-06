"use strict";
// Validation functions for NMR data
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipletnumbers = multipletnumbers;
exports.validateNMRPeak = validateNMRPeak;
exports.validateNMRData = validateNMRData;
exports.validateRichTextContent = validateRichTextContent;
// Regular expression pattern for multiplicity validation
const MULTIPLICITY_PATTERN = /^((d|t|q|quint)+|((doublet|triplet|quartet|quintet)\sof\s)*(singlets?|doublets?|triplets?|quartets?|quintets?)|s|m|br|singlets?|multiplets?|broad)$/i;
// Function to get expected number of J-values based on multiplicity
// Returns null for singlet(s), multiplet(m), or broad(br)
// Returns array of expected J-value counts for compound multiplicities (e.g., dt -> [2,3])
function multipletnumbers(multiplicityText) {
    // Validate input against multiplicity pattern
    if (!MULTIPLICITY_PATTERN.test(multiplicityText)) {
        throw new Error(`Invalid multiplicity: "${multiplicityText}" does not match expected pattern`);
    }
    const clean = multiplicityText.toLowerCase().trim();
    // Cases that should return null (no J-values expected)
    if (/^(s|singlets?|m|multiplets?|br|broad)$/.test(clean)) {
        return null;
    }
    // Map single multiplicity letters to their J-value counts
    const multiplicityMap = {
        'd': 2,
        't': 3,
        'q': 4,
        'quint': 5
    };
    // Handle compound multiplicities like "dt", "dd", "ddd", etc.
    const compoundMatch = clean.match(/^([dtq]|quint)+$/);
    if (compoundMatch) {
        const letters = clean.split('');
        const jCounts = [];
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];
            if (letter === 'q' && i < letters.length - 4 && letters.slice(i, i + 5).join('') === 'quint') {
                jCounts.push(multiplicityMap['quint']);
                i += 4; // Skip the remaining letters of "quint"
            }
            else if (multiplicityMap[letter]) {
                jCounts.push(multiplicityMap[letter]);
            }
        }
        return jCounts.length > 0 ? jCounts : null;
    }
    // Handle full word forms like "doublet of triplet"
    const wordPattern = /((doublet|triplet|quartet|quintet)\sof\s)*(doublet|triplet|quartet|quintet)/i;
    const wordMatch = clean.match(wordPattern);
    if (wordMatch) {
        const wordMap = {
            'doublet': 2,
            'triplet': 3,
            'quartet': 4,
            'quintet': 5
        };
        const jCounts = [];
        const words = clean.match(/(doublet|triplet|quartet|quintet)/gi);
        if (words) {
            words.forEach(word => {
                const count = wordMap[word.toLowerCase()];
                if (count)
                    jCounts.push(count);
            });
        }
        return jCounts.length > 0 ? jCounts : null;
    }
    // Single letter multiplicities (d, t, q)
    if (multiplicityMap[clean]) {
        return [multiplicityMap[clean]];
    }
    // If we get here, something unexpected happened
    throw new Error(`Unhandled multiplicity format: "${multiplicityText}"`);
}
// Validation functions using existing patterns - only J-value and multiplicity consistency
function validateNMRPeak(peak, index) {
    const errors = [];
    // Only validate J-value count against multiplicity
    if (peak.multiplicity) {
        try {
            const expectedJCounts = multipletnumbers(peak.multiplicity);
            if (expectedJCounts !== null) {
                const actualJCount = peak.jValues.filter(j => !isNaN(j) && j > 0).length;
                const expectedTotal = expectedJCounts.length; // Just the array length
                if (actualJCount !== expectedTotal) {
                    errors.push({
                        type: 'peak',
                        index,
                        field: 'jcount',
                        message: `Multiplicity "${peak.multiplicity}" expects ${expectedTotal} J-values, but found ${actualJCount}`
                    });
                }
            }
        }
        catch (error) {
            // Invalid multiplicity format - ignore as it's not our concern
        }
    }
    return errors;
}
function validateNMRData(nmrData) {
    const errors = [];
    if (!nmrData || !nmrData.peaks) {
        return [];
    }
    // Validate each peak (only J-value and multiplicity consistency)
    nmrData.peaks.forEach((peak, index) => {
        const peakErrors = validateNMRPeak(peak, index);
        errors.push(...peakErrors);
    });
    return errors;
}
function validateRichTextContent(textContent, parseFunction) {
    try {
        const parsedData = parseFunction(textContent);
        return validateNMRData(parsedData);
    }
    catch (error) {
        // Parse errors are not validation errors - allow parsing to proceed
        return [];
    }
}
//# sourceMappingURL=validators.js.map