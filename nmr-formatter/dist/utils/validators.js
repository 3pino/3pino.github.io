"use strict";
// Validation functions for NMR data
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipletnumbers = multipletnumbers;
exports.isJValuesOptional = isJValuesOptional;
exports.validateNMRPeak = validateNMRPeak;
exports.validateNMRData = validateNMRData;
exports.validateRichTextContent = validateRichTextContent;
// Regular expression pattern for multiplicity validation
const MULTIPLICITY_PATTERN = /^[a-zA-Z0-9\s\-]+$/;
// Function to get expected number of J-values based on multiplicity
// Returns null for singlet(s), multiplet(m), or broad(br)
// Returns array of expected J-value counts for compound multiplicities (e.g., dt -> [2,3])
function multipletnumbers(multiplicityText) {
    const clean = multiplicityText.toLowerCase().trim();
    let normalized = clean;
    const replacementMap = [
        [/\s+of\s+/g, ' '],
        [/[\s\-–()]+/g, ' '],
        [/broad\s*/g, ''],
        [/br\s*/g, ''],
        // Full words - keep s and m
        [/nonets?/g, '9'],
        [/octets?/g, '8'],
        [/septets?/g, '7'],
        [/sextets?/g, '6'],
        [/quintets?/g, '5'],
        [/quartets?/g, '4'],
        [/triplets?/g, '3'],
        [/doublets?/g, '2'],
        [/singlets?/g, 's'],
        [/multiplets?/g, 'm'],
        // Abbreviations - keep s and m
        [/non(?!et)/g, '9'],
        [/oct(?!et)/g, '8'],
        [/sept(?!et)/g, '7'],
        [/sext(?!et)/g, '6'],
        [/quint(?!et)/g, '5'],
        [/q(?!u)/g, '4'],
        [/t(?!r|e)/g, '3'],
        [/d(?!o)/g, '2'],
        [/s(?!i)/g, 's'],
        [/m(?!u)/g, 'm'],
        [/b(?!r|o)/g, ''],
        [/\s+/g, ''],
    ];
    replacementMap.forEach(([pattern, replacement]) => {
        normalized = normalized.replace(pattern, replacement);
    });
    normalized = normalized.trim();
    // Validate s/m combinations
    if (/s/.test(normalized) || /m/.test(normalized)) {
        // Check for invalid s patterns
        if (/[sm][sm]/.test(normalized)) {
            throw new Error(`Invalid multiplicity combination: "${multiplicityText}" (multiple s / m)`);
        }
        if (/s\d|\ds/.test(normalized)) {
            throw new Error(`Invalid multiplicity combination: "${multiplicityText}" (s cannot combine with other multiplicities)`);
        }
        // Check for invalid m patterns
        if (/\dm/.test(normalized)) {
            throw new Error(`Invalid multiplicity combination: "${multiplicityText}" (m must be at the beginning)`);
        }
        // Single s or m is OK
        if (normalized === 's' || normalized === 'm') {
            return null;
        }
        // m + digits is OK (e.g., "m23" from "m(dt)")
        if (/^m\d+$/.test(normalized)) {
            const digits = normalized.match(/\d/g);
            if (digits && digits.length > 0) {
                return digits.map(d => parseInt(d, 10));
            }
        }
        // If we reach here, it's an invalid s/m combination
        throw new Error(`Invalid multiplicity combination: "${multiplicityText}"`);
    }
    if (normalized === '')
        return null;
    const digits = normalized.match(/\d/g);
    if (digits && digits.length > 0) {
        return digits.map(d => parseInt(d, 10));
    }
    throw new Error(`Unhandled multiplicity format: "${multiplicityText}"`);
}
/**
 * Check if J-values are optional for a given multiplicity
 * Returns true if multiplicity contains 'm', 'br', or 'broad' (e.g., "m(tt)", "br d", "bs")
 * @param {string} multiplicityText - Multiplicity string
 * @returns {boolean} - True if J-values are optional
 */
function isJValuesOptional(multiplicityText) {
    const clean = multiplicityText.toLowerCase().trim();
    // Check if contains m/br/broad
    const hasBroadOrMultiplet = /\b(m|multiplet|br|broad)\b|^b/.test(clean);
    if (!hasBroadOrMultiplet) {
        return false; // No m/br/broad → not optional
    }
    // If it's ONLY m/br/broad (no other multiplicity), return false
    // because J-values must be 0 (handled by multipletnumbers returning null)
    const jCounts = multipletnumbers(multiplicityText);
    if (jCounts === null) {
        return false; // Only m/br/broad → J-values must be 0, not optional
    }
    // Has both m/br/broad AND other multiplicity → optional
    return true;
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
                const expectedTotal = expectedJCounts.length;
                // Check if J-values are optional (e.g., "m(tt)", "br d")
                const isOptional = isJValuesOptional(peak.multiplicity);
                // If optional: allow 0 or expectedTotal J-values
                // If not optional: must have exactly expectedTotal J-values
                if (!isOptional && actualJCount !== expectedTotal) {
                    errors.push({
                        type: 'peak',
                        index,
                        field: 'jcount',
                        message: `Multiplicity "${peak.multiplicity}" expects ${expectedTotal} J-values, but found ${actualJCount}`
                    });
                }
                else if (isOptional && actualJCount !== 0 && actualJCount !== expectedTotal) {
                    errors.push({
                        type: 'peak',
                        index,
                        field: 'jcount',
                        message: `Multiplicity "${peak.multiplicity}" expects 0 or ${expectedTotal} J-values, but found ${actualJCount}`
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