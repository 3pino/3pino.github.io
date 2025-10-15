/**
 * Field-level validation logic
 * Each validator provides input filtering and validation rules for a specific field type
 */

import { parseChemicalShift, convertMultiplicityToText } from '../conversion';
import { NMRPeak } from '../../models/NMRPeak';
import { filterNumericInput, noFilter } from './input-filters';

/**
 * Validation result
 */
export interface FieldValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Field validator interface
 */
export interface FieldValidator {
  /**
   * Filter input in real-time (input restriction)
   */
  filterInput: (value: string) => string;
  
  /**
   * Validate value and return error message if invalid
   */
  validate: (value: string | number, context?: any) => FieldValidationResult;
}

/**
 * Chemical Shift validator
 */
export const shiftValidator: FieldValidator = {
  filterInput: noFilter,
  
  validate: (value: string | number): FieldValidationResult => {
    const strValue = typeof value === 'number' ? value.toString() : value;
    
    if (!strValue || strValue.trim() === '') {
      return { isValid: false, errorMessage: 'Chemical shift is required' };
    }
    
    const parsed = parseChemicalShift(strValue);
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
export const multiplicityValidator: FieldValidator = {
  filterInput: noFilter,
  
  validate: (value: string | number, context?: { is1HNMR: boolean }): FieldValidationResult => {
    const strValue = typeof value === 'number' ? value.toString() : value;
    const is1HNMR = context?.is1HNMR ?? false;
    
    // Only validate for 1H NMR
    if (!is1HNMR) {
      return { isValid: true };
    }
    
    if (!strValue || strValue.trim() === '') {
      return { isValid: false, errorMessage: 'Multiplicity is required for 1H NMR' };
    }
    
    const multiplicityText = convertMultiplicityToText(strValue);
    
    try {
      NMRPeak.multipletnumbers(multiplicityText);
      return { isValid: true };
    } catch (error) {
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
export const jValueValidator: FieldValidator = {
  filterInput: filterNumericInput,
  
  validate: (value: string | number, context?: { 
    multiplicity: string; 
    jIndex: number; 
    allJValues: number[] 
  }): FieldValidationResult => {
    if (!context?.multiplicity) {
      return { isValid: true }; // No multiplicity, no validation
    }
    
    const multiplicityText = convertMultiplicityToText(context.multiplicity);
    const jCounts = NMRPeak.multipletnumbers(multiplicityText);
    
    if (jCounts === null) {
      return { isValid: true }; // Singlet/multiplet/broad - no J-values needed
    }
    
    const requiredJCount = jCounts.length;
    const isOptional = NMRPeak.isJValuesOptional(multiplicityText);
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
    } else {
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
export const integrationValidator: FieldValidator = {
  filterInput: filterNumericInput,
  
  validate: (value: string | number, context?: { is1HNMR: boolean }): FieldValidationResult => {
    const is1HNMR = context?.is1HNMR ?? false;
    
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
export const assignmentValidator: FieldValidator = {
  filterInput: noFilter, // HTML filtering is done separately in the UI
  
  validate: (): FieldValidationResult => {
    return { isValid: true }; // Always valid - optional field
  }
};

/**
 * Get validator for a specific field type
 */
export function getValidator(fieldType: string): FieldValidator | null {
  const validators: { [key: string]: FieldValidator } = {
    'shift': shiftValidator,
    'multiplicity': multiplicityValidator,
    'jValue': jValueValidator,
    'integration': integrationValidator,
    'assignment': assignmentValidator
  };
  
  return validators[fieldType] || null;
}
