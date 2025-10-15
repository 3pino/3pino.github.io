/**
 * TSV (Tab-Separated Values) parser utilities
 */

/**
 * Check if the given text contains TSV data
 * TSV is detected if the text contains at least one tab or newline character
 * @param text - Text to check
 * @returns True if text contains tab or newline
 */
export function isTSVData(text: string): boolean {
  return text.includes('\t') || text.includes('\n');
}

/**
 * Parse TSV data into a 2D array
 * @param text - TSV text to parse
 * @returns 2D array of cell values
 */
export function parseTSV(text: string): string[][] {
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by lines
  const lines = normalized.split('\n');
  
  // Parse each line by tabs
  return lines.map(line => line.split('\t'));
}
