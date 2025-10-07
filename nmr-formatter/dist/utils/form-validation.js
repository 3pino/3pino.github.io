"use strict";
/**
 * Utility functions for validating NMR data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMetadata = validateMetadata;
exports.validateTableRow = validateTableRow;
exports.validateTableRows = validateTableRows;
const conversion_1 = require("./conversion");
/**
 * Validate metadata fields
 * @returns true if there are errors
 */
function validateMetadata(metadata, validationState) {
    let hasErrors = false;
    if (!metadata.nuclei || metadata.nuclei.trim() === '') {
        validationState.setError('nuclei', 'Nuclei is required');
        hasErrors = true;
    }
    if (!metadata.solvent || metadata.solvent.trim() === '') {
        validationState.setError('solvent', 'Solvent is required');
        hasErrors = true;
    }
    if (!metadata.frequency || metadata.frequency === 0) {
        validationState.setError('frequency', 'Frequency is required');
        hasErrors = true;
    }
    return hasErrors;
}
/**
 * Validate a single table row
 * @returns true if there are errors
 */
function validateTableRow(row, is1HNMR, validationState) {
    let hasErrors = false;
    const rowId = row.id;
    // Validate chemical shift
    const shift = (0, conversion_1.parseChemicalShift)(row.shift);
    if (shift === null || row.shift.trim() === '') {
        validationState.setError(`shift-${rowId}`, 'Invalid chemical shift');
        hasErrors = true;
    }
    // Validate multiplicity (for 1H NMR)
    if (is1HNMR) {
        const multiplicity = (0, conversion_1.convertMultiplicityToText)(row.multiplicity);
        if (row.multiplicity.trim() === '') {
            validationState.setError(`mult-${rowId}`, 'Multiplicity is required for 1H NMR');
            hasErrors = true;
        }
        else {
            try {
                const multipletnumbers = window.multipletnumbers;
                multipletnumbers(multiplicity);
            }
            catch (error) {
                validationState.setError(`mult-${rowId}`, 'Invalid multiplicity');
                hasErrors = true;
            }
        }
        // Validate integration (for 1H NMR)
        if (!row.integration || row.integration === 0) {
            validationState.setError(`int-${rowId}`, 'Integration is required for 1H NMR');
            hasErrors = true;
        }
    }
    // Validate J-values
    const multiplicity = (0, conversion_1.convertMultiplicityToText)(row.multiplicity);
    const isJValuesOptional = window.isJValuesOptional;
    const isOptional = multiplicity && isJValuesOptional(multiplicity);
    const requiredJCount = (0, conversion_1.calculateRequiredJColumns)(multiplicity);
    const actualJCount = row.jValues.filter((j) => !isNaN(j) && j !== 0).length;
    if (isOptional) {
        // Optional: either all empty or all filled
        if (actualJCount > 0 && actualJCount < requiredJCount) {
            for (let i = 0; i < requiredJCount; i++) {
                if (!row.jValues[i] || row.jValues[i] === 0) {
                    validationState.setError(`j${i}-${rowId}`, 'All J-values must be filled');
                    hasErrors = true;
                }
            }
        }
    }
    else {
        // Not optional: all must be filled
        for (let i = 0; i < requiredJCount; i++) {
            if (!row.jValues[i] || row.jValues[i] === 0) {
                validationState.setError(`j${i}-${rowId}`, 'J-value is required');
                hasErrors = true;
            }
        }
    }
    return hasErrors;
}
/**
 * Validate all table rows
 * @returns true if there are errors
 */
function validateTableRows(rows, is1HNMR, validationState) {
    let hasErrors = false;
    rows.forEach(row => {
        if (validateTableRow(row, is1HNMR, validationState)) {
            hasErrors = true;
        }
    });
    return hasErrors;
}
//# sourceMappingURL=form-validation.js.map