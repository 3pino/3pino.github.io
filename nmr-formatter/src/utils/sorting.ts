/**
 * Utility functions for sorting NMR data
 */

import { NMRPeak } from '../models/NMRPeak';

/**
 * Sort peaks array by chemical shift value
 */
export function sortPeaksByShift(peaks: NMRPeak[], order: 'asc' | 'desc'): void {
    peaks.sort((a, b) => {
        const aValue = getShiftValue(a.chemicalShift);
        const bValue = getShiftValue(b.chemicalShift);

        if (order === 'asc') {
            return aValue - bValue;
        } else {
            return bValue - aValue;
        }
    });
}

/**
 * Get numeric value from chemical shift (average for ranges)
 */
export function getShiftValue(shift: number | [number, number]): number {
    if (Array.isArray(shift)) {
        return (shift[0] + shift[1]) / 2;
    }
    return shift;
}
