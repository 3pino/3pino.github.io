"use strict";
/**
 * Input filtering utilities for real-time input restriction
 * These functions filter user input to prevent invalid characters from being entered
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterNumericInput = filterNumericInput;
exports.filterHTMLTags = filterHTMLTags;
exports.noFilter = noFilter;
/**
 * Filter numeric input to allow only digits and one decimal point
 * Used for J-values and Integration fields
 * @param value - The input value to filter
 * @returns Filtered value containing only digits and at most one decimal point
 * @example
 * filterNumericInput("12.34.56") // "12.3456"
 * filterNumericInput("abc123") // "123"
 * filterNumericInput("1.2.3") // "1.23"
 */
function filterNumericInput(value) {
    // Remove all non-numeric characters except decimal point
    let filtered = value.replace(/[^0-9.]/g, '');
    // Allow only one decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
        filtered = parts[0] + '.' + parts.slice(1).join('');
    }
    return filtered;
}
/**
 * Filter HTML content to allow only specific tags
 * Used for Assignment field to restrict rich text formatting
 * @param container - DOM element containing HTML to filter
 * @param allowedTags - Array of uppercase tag names to allow (e.g., ['B', 'I', 'SUB', 'SUP'])
 * @returns Filtered HTML string
 */
function filterHTMLTags(container, allowedTags) {
    const clone = container.cloneNode(true);
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(el => {
        var _a;
        if (!allowedTags.includes(el.tagName)) {
            // Replace disallowed element with its text content
            const textNode = document.createTextNode(el.textContent || '');
            (_a = el.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(textNode, el);
        }
    });
    return clone.innerHTML;
}
/**
 * No filtering - allows any input
 * Used for Chemical Shift and Multiplicity fields
 * @param value - The input value
 * @returns Unmodified value
 */
function noFilter(value) {
    return value;
}
//# sourceMappingURL=input-filters.js.map