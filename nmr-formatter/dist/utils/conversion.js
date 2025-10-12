"use strict";
/**
 * Utility functions for data parsing and conversion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChemicalShift = parseChemicalShift;
exports.convertMultiplicityToText = convertMultiplicityToText;
exports.calculateRequiredJColumns = calculateRequiredJColumns;
/**
 * Parse chemical shift string to number or range
 * Supports formats: "7.53", "7.53-7.50", "7.53–7.50"
 */
function parseChemicalShift(value) {
    if (!value || value.trim() === '')
        return null;
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
/**
 * Convert multiplicity input to text format
 * Supports numeric shorthand: "1" -> "s", "23" -> "dt", etc.
 */
function convertMultiplicityToText(input) {
    if (!input || input.trim() === '')
        return '';
    const trimmed = input.trim();
    // Check if input is purely numeric
    if (/^\d+$/.test(trimmed)) {
        const digitMap = {
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
/**
 * Calculate required J-value columns based on multiplicity
 */
function calculateRequiredJColumns(multiplicity) {
    if (!multiplicity || multiplicity.trim() === '') {
        return 0;
    }
    try {
        const w = window;
        // Type guard: ensure the function exists
        if (typeof w.multipletnumbers !== 'function') {
            console.warn('multipletnumbers function not found on window');
            return 0;
        }
        const jCounts = w.multipletnumbers(multiplicity);
        // Validate return value
        if (jCounts === null || !Array.isArray(jCounts)) {
            return 0;
        }
        return jCounts.length;
    }
    catch (error) {
        console.error('Error calculating J columns:', error);
        return 0;
    }
}
//# sourceMappingURL=conversion.js.map