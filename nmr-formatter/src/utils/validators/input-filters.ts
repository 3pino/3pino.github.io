/**
 * Input filtering utilities for real-time input restriction
 * These functions filter user input to prevent invalid characters from being entered
 */

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
export function filterNumericInput(value: string): string {
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
 * Filter chemical shift input to allow numbers, decimal points, and range indicators
 * Used for Chemical Shift (δ) field which can be a single value or a range
 * Allows: digits, decimal points, minus sign (-), en dash (–), negative numbers
 * @param value - The input value to filter
 * @returns Filtered value for chemical shift input
 * @example
 * filterChemicalShiftInput("7.25-7.30") // "7.25-7.30"
 * filterChemicalShiftInput("7.25–7.30") // "7.25–7.30"
 * filterChemicalShiftInput("-1.5") // "-1.5"
 * filterChemicalShiftInput("abc7.25") // "7.25"
 */
export function filterChemicalShiftInput(value: string): string {
  // Allow: digits (0-9), decimal point (.), hyphen-minus (-), en dash (–)
  return value.replace(/[^0-9.\-–]/g, '');
}

/**
 * Filter HTML content to allow only specific tags
 * Used for Assignment field to restrict rich text formatting
 * @param container - DOM element containing HTML to filter
 * @param allowedTags - Array of uppercase tag names to allow (e.g., ['B', 'I', 'SUB', 'SUP'])
 * @returns Filtered HTML string
 */
export function filterHTMLTags(container: HTMLElement, allowedTags: string[]): string {
  const clone = container.cloneNode(true) as HTMLElement;
  const allElements = clone.querySelectorAll('*');
  
  allElements.forEach(el => {
    if (!allowedTags.includes(el.tagName)) {
      // Replace disallowed element with its text content
      const textNode = document.createTextNode(el.textContent || '');
      el.parentNode?.replaceChild(textNode, el);
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
export function noFilter(value: string): string {
  return value;
}
