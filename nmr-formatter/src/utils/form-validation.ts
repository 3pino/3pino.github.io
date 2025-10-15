/**
 * Utility functions for validating NMR data
 */

import { ValidationState } from '../state/ValidationState';
import { TableRowData } from '../state/TableState';
import { convertMultiplicityToText } from './conversion';
import { NMRPeak } from '../models/NMRPeak';
import {
    shiftValidator,
    multiplicityValidator,
    jValueValidator,
    integrationValidator
} from './validators/field-validators';

export interface MetadataValidationData {
    nuclei: string;
    solvent: string;
    frequency: number;
}

/**
 * Validate metadata fields
 * @returns true if there are errors
 */
export function validateMetadata(
    metadata: MetadataValidationData,
    validationState: ValidationState
): boolean {
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
export function validateTableRow(
    row: TableRowData,
    is1HNMR: boolean,
    validationState: ValidationState
): boolean {
    let hasErrors = false;
    const rowId = row.id;

    // Validate chemical shift using field validator
    const shiftResult = shiftValidator.validate(row.shift);
    if (!shiftResult.isValid) {
        validationState.setError(`shift-${rowId}`, shiftResult.errorMessage || 'Invalid chemical shift');
        hasErrors = true;
    } else {
        validationState.clearError(`shift-${rowId}`);
    }

    // Validate multiplicity using field validator
    const multResult = multiplicityValidator.validate(row.multiplicity, { is1HNMR });
    if (!multResult.isValid) {
        validationState.setError(`mult-${rowId}`, multResult.errorMessage || 'Invalid multiplicity');
        hasErrors = true;
    } else {
        validationState.clearError(`mult-${rowId}`);
    }

    // Validate integration using field validator
    const intResult = integrationValidator.validate(row.integration, { is1HNMR });
    if (!intResult.isValid) {
        validationState.setError(`int-${rowId}`, intResult.errorMessage || 'Invalid integration');
        hasErrors = true;
    } else {
        validationState.clearError(`int-${rowId}`);
    }

    // Validate J-values using field validator
    const multiplicity = convertMultiplicityToText(row.multiplicity);
    let requiredJCount = 0;
    try {
        const jCounts = NMRPeak.multipletnumbers(multiplicity);
        requiredJCount = jCounts?.length || 0;
    } catch (error) {
        // Invalid multiplicity - skip J-value validation
    }

    for (let i = 0; i < requiredJCount; i++) {
        const jResult = jValueValidator.validate(
            row.jValues[i] || 0,
            {
                multiplicity: row.multiplicity,
                jIndex: i,
                allJValues: row.jValues
            }
        );

        if (!jResult.isValid) {
            validationState.setError(`j${i}-${rowId}`, jResult.errorMessage || 'Invalid J-value');
            hasErrors = true;
        } else {
            validationState.clearError(`j${i}-${rowId}`);
        }
    }

    // Clear errors for J-values beyond required count
    for (let i = requiredJCount; i < row.jValues.length; i++) {
        validationState.clearError(`j${i}-${rowId}`);
    }

    return hasErrors;
}

/**
 * Validate all table rows
 * @returns true if there are errors
 */
export function validateTableRows(
    rows: TableRowData[],
    is1HNMR: boolean,
    validationState: ValidationState
): boolean {
    let hasErrors = false;

    rows.forEach(row => {
        if (validateTableRow(row, is1HNMR, validationState)) {
            hasErrors = true;
        }
    });

    return hasErrors;
}
