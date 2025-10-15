"use strict";
/**
 * Field-level validation logic
 * Each validator provides input filtering and validation rules for a specific field type
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentValidator = exports.integrationValidator = exports.jValueValidator = exports.multiplicityValidator = exports.shiftValidator = void 0;
exports.getValidator = getValidator;
const conversion_1 = require("../conversion");
const NMRPeak_1 = require("../../models/NMRPeak");
const input_filters_1 = require("./input-filters");
/**
 * Chemical Shift validator
 */
exports.shiftValidator = {
    filterInput: input_filters_1.noFilter,
    validate: (value) => {
        const strValue = typeof value === 'number' ? value.toString() : value;
        if (!strValue || strValue.trim() === '') {
            return { isValid: false, errorMessage: 'Chemical shift is required' };
        }
        const parsed = (0, conversion_1.parseChemicalShift)(strValue);
        if (parsed === null) {
            return { isValid: false, errorMessage: 'Invalid chemical shift' };
        }
        return { isValid: true };
    }
};
/**
 * Multiplicity validator
 * @param context.is1HNMR - Whether this is 1H NMR (multiplicity required)
 */
exports.multiplicityValidator = {
    filterInput: input_filters_1.noFilter,
    validate: (value, context) => {
        var _a;
        const strValue = typeof value === 'number' ? value.toString() : value;
        const is1HNMR = (_a = context === null || context === void 0 ? void 0 : context.is1HNMR) !== null && _a !== void 0 ? _a : false;
        // Only validate for 1H NMR
        if (!is1HNMR) {
            return { isValid: true };
        }
        if (!strValue || strValue.trim() === '') {
            return { isValid: false, errorMessage: 'Multiplicity is required for 1H NMR' };
        }
        const multiplicityText = (0, conversion_1.convertMultiplicityToText)(strValue);
        try {
            NMRPeak_1.NMRPeak.multipletnumbers(multiplicityText);
            return { isValid: true };
        }
        catch (error) {
            return { isValid: false, errorMessage: 'Invalid multiplicity' };
        }
    }
};
/**
 * J-value validator
 * @param context.multiplicity - The multiplicity text to determine required J count
 * @param context.jIndex - Index of this J-value (0-based)
 * @param context.allJValues - All J-values for this peak
 */
exports.jValueValidator = {
    filterInput: input_filters_1.filterNumericInput,
    validate: (value, context) => {
        if (!(context === null || context === void 0 ? void 0 : context.multiplicity)) {
            return { isValid: true }; // No multiplicity, no validation
        }
        const multiplicityText = (0, conversion_1.convertMultiplicityToText)(context.multiplicity);
        const jCounts = NMRPeak_1.NMRPeak.multipletnumbers(multiplicityText);
        if (jCounts === null) {
            return { isValid: true }; // Singlet/multiplet/broad - no J-values needed
        }
        const requiredJCount = jCounts.length;
        const isOptional = NMRPeak_1.NMRPeak.isJValuesOptional(multiplicityText);
        const actualJCount = context.allJValues.filter(j => !isNaN(j) && j !== 0).length;
        if (isOptional) {
            // Optional: either all empty or all filled
            if (actualJCount > 0 && actualJCount < requiredJCount) {
                // Partial fill - check if this specific J-value is empty
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                if (isNaN(numValue) || numValue === 0) {
                    return { isValid: false, errorMessage: 'All J-values must be filled' };
                }
            }
            return { isValid: true };
        }
        else {
            // Not optional: all must be filled
            if (context.jIndex < requiredJCount) {
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                if (isNaN(numValue) || numValue === 0) {
                    return { isValid: false, errorMessage: 'J-value is required' };
                }
            }
            return { isValid: true };
        }
    }
};
/**
 * Integration validator
 * @param context.is1HNMR - Whether this is 1H NMR (integration required)
 */
exports.integrationValidator = {
    filterInput: input_filters_1.filterNumericInput,
    validate: (value, context) => {
        var _a;
        const is1HNMR = (_a = context === null || context === void 0 ? void 0 : context.is1HNMR) !== null && _a !== void 0 ? _a : false;
        // Only validate for 1H NMR
        if (!is1HNMR) {
            return { isValid: true };
        }
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numValue) || numValue === 0) {
            return { isValid: false, errorMessage: 'Integration is required for 1H NMR' };
        }
        return { isValid: true };
    }
};
/**
 * Assignment validator
 * No validation - optional field
 */
exports.assignmentValidator = {
    filterInput: input_filters_1.noFilter, // HTML filtering is done separately in the UI
    validate: () => {
        return { isValid: true }; // Always valid - optional field
    }
};
/**
 * Get validator for a specific field type
 */
function getValidator(fieldType) {
    const validators = {
        'shift': exports.shiftValidator,
        'multiplicity': exports.multiplicityValidator,
        'jValue': exports.jValueValidator,
        'integration': exports.integrationValidator,
        'assignment': exports.assignmentValidator
    };
    return validators[fieldType] || null;
}
//# sourceMappingURL=field-validators.js.map