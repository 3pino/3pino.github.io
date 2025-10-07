"use strict";
/**
 * Utility functions for sorting NMR data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortPeaksByShift = sortPeaksByShift;
exports.getShiftValue = getShiftValue;
/**
 * Sort peaks array by chemical shift value
 */
function sortPeaksByShift(peaks, order) {
    peaks.sort((a, b) => {
        const aValue = getShiftValue(a.chemicalShift);
        const bValue = getShiftValue(b.chemicalShift);
        if (order === 'asc') {
            return aValue - bValue;
        }
        else {
            return bValue - aValue;
        }
    });
}
/**
 * Get numeric value from chemical shift (average for ranges)
 */
function getShiftValue(shift) {
    if (Array.isArray(shift)) {
        return (shift[0] + shift[1]) / 2;
    }
    return shift;
}
//# sourceMappingURL=sorting.js.map