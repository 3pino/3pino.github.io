/**
 * TopSpin data parser utilities
 * Handles parsing of Bruker TopSpin NMR data files
 */

import { NMRPeak } from '../models/NMRPeak';
import { Metadata } from '../models/Metadata';
import { extractSolventHTMLFromText, extractNucleiHTMLFromText } from '../core/constants';

/**
 * Internal helper: Find the first valid TopSpin directory from the given files
 * @param files - Array of files to check
 * @returns Object containing the directory path and the three required files, or null if not found
 */
function findTopSpinDirectory(files: File[]): {
  dirPath: string;
  integralFile: File;
  parmFile: File;
  peaklistFile: File;
} | null {
  const requiredFiles = ['integrals.txt', 'parm.txt', 'peaklist.xml'];

  // Extract directory path from file path
  // File.webkitRelativePath gives us the full path for dropped directories
  const getDirectoryPath = (file: File): string => {
    const path = file.webkitRelativePath || file.name;
    const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return lastSlash >= 0 ? path.substring(0, lastSlash) : '';
  };

  // Group files by directory path
  const filesByDirectory = new Map<string, Map<string, File>>();

  for (const file of files) {
    const dirPath = getDirectoryPath(file);
    const fileName = file.name;

    if (!filesByDirectory.has(dirPath)) {
      filesByDirectory.set(dirPath, new Map());
    }
    filesByDirectory.get(dirPath)!.set(fileName, file);
  }

  // Find first directory with all three required files
  for (const [dirPath, fileMap] of filesByDirectory.entries()) {
    const hasAllRequired = requiredFiles.every(required => fileMap.has(required));
    if (hasAllRequired) {
      console.log("TopSpin directory found:", dirPath);
      return {
        dirPath,
        integralFile: fileMap.get('integrals.txt')!,
        parmFile: fileMap.get('parm.txt')!,
        peaklistFile: fileMap.get('peaklist.xml')!
      };
    }
  }

  return null;
}

/**
 * Check if the given files contain TopSpin data
 * TopSpin data is identified by the presence of specific files like peaklist.xml and acqus
 * @param files - Array of files to check
 * @returns True if files contain TopSpin data structure
 */
export function isTopSpinData(files: File[]): boolean {
  return findTopSpinDirectory(files) !== null;
}

/**
 * Parse TopSpin directory structure and extract NMR peaks
 * @param files - Array of files from TopSpin directory
 * @returns Array of parsed NMR peaks
 */
export async function parseTopSpinDirectory(files: File[]): Promise<NMRPeak[]> {
  const topspinDir = findTopSpinDirectory(files);

  if (!topspinDir) {
    throw new Error('TopSpin data not found in provided files');
  }

  // Read all three files asynchronously
  const [integralContent, parmContent, peaklistContent] = await Promise.all([
    topspinDir.integralFile.text(),
    topspinDir.parmFile.text(),
    topspinDir.peaklistFile.text()
  ]);

  // Parse all three files
  const integrals = parseIntegrals(integralContent);
  const chemicalShifts = parseTopSpinXML(peaklistContent);

  // Create NMRPeak objects by matching F1 values to integration ranges
  const peaks: NMRPeak[] = [];

  for (const integral of integrals) {
    // Find F1 values within this integration range
    const min = Math.min(integral.rangeStart, integral.rangeEnd);
    const max = Math.max(integral.rangeStart, integral.rangeEnd);

    const f1InRange = chemicalShifts.filter(f1 => f1 >= min && f1 <= max);

    // Calculate shift (chemical shift position)
    let shift: number;
    if (f1InRange.length === 0) {
      // No F1 values found, use average of integration range
      shift = (integral.rangeStart + integral.rangeEnd) / 2;
    } else if (f1InRange.length % 2 === 1) {
      // Odd number: use median (middle value)
      const sorted = [...f1InRange].sort((a, b) => a - b);
      shift = sorted[Math.floor(sorted.length / 2)];
    } else {
      // Even number: use average of two middle values
      const sorted = [...f1InRange].sort((a, b) => a - b);
      const mid = sorted.length / 2;
      shift = (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Calculate multiplicity
    const multiplicity = getMultiplicityLabel(f1InRange.length);

    // Calculate J-values
    const jValues = calculateJValues(f1InRange);

    // Create NMRPeak object
    const peak = new NMRPeak(
      shift,
      multiplicity,
      jValues,
      integral.integral,
      '' // assignment is empty
    );

    peaks.push(peak);
  }

  return peaks;
}

/**
 * Parse TopSpin XML peaklist file into NMR peaks
 * @param xmlContent - Content of peaklist.xml file
 * @returns Array of parsed NMR peaks
 */
export function parseTopSpinXML(xmlContent: string): number[] {
  const chemicalShifts: number[] = [];

  // Use regex to extract all F1 attribute values from Peak1D elements
  // Pattern: <Peak1D F1="value" .../>
  const peak1DPattern = /<Peak1D\s+F1="([\d.]+)"/g;

  let match;
  while ((match = peak1DPattern.exec(xmlContent)) !== null) {
    const f1Value = parseFloat(match[1]);
    if (!isNaN(f1Value)) {
      chemicalShifts.push(f1Value);
    }
  }

  return chemicalShifts;
}

/**
 * Parse TopSpin acqus file to extract metadata
 * @param acqusContent - Content of acqus parameter file
 * @returns Partial metadata object with nuclei, solvent, and frequency
 */
/**
 * Parse integrals.txt to extract integration ranges and values
 * @param integralsContent - Content of integrals.txt file
 * @returns Array of integration data with range and value
 */
function parseIntegrals(integralsContent: string): Array<{
  rangeStart: number;
  rangeEnd: number;
  integral: number;
}> {
  const integrals: Array<{ rangeStart: number; rangeEnd: number; integral: number }> = [];
  const lines = integralsContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip header lines and empty lines
    if (!trimmedLine || trimmedLine.startsWith('Current') ||
        trimmedLine.startsWith('NAME') || trimmedLine.startsWith('DU') ||
        trimmedLine.startsWith('Number')) {
      continue;
    }

    // Parse line format: "Number   Start   End   Integral"
    // Example: "    1      8.591      8.549         2.21014"
    const parts = trimmedLine.split(/\s+/);
    if (parts.length >= 4) {
      const rangeStart = parseFloat(parts[1]);
      const rangeEnd = parseFloat(parts[2]);
      const integral = parseFloat(parts[3]);

      if (!isNaN(rangeStart) && !isNaN(rangeEnd) && !isNaN(integral)) {
        integrals.push({ rangeStart, rangeEnd, integral });
      }
    }
  }

  return integrals;
}

/**
 * Calculate multiplicity label from number of F1 peaks
 * @param count - Number of F1 peaks in the integration range
 * @returns Multiplicity label (s, d, t, q, etc., or m for many)
 */
function getMultiplicityLabel(count: number): string {
  if (count === 0) return 's';
  if (count >= 10) return 'm';
  return count.toString();
}

/**
 * Calculate J-coupling value from F1 peak distribution
 * @param f1Values - Array of F1 values in the integration range
 * @returns J-coupling value in Hz, or empty array if not applicable
 */
function calculateJValues(f1Values: number[]): number[] {
  if (f1Values.length < 2 || f1Values.length >= 10) {
    return [];
  }

  // Calculate (max - min) / (count - 1)
  const min = Math.min(...f1Values);
  const max = Math.max(...f1Values);
  const jValue = (max - min) / (f1Values.length - 1);

  return [jValue];
}

export function parseTopSpinMetadata(parmContent: string): Partial<Metadata> {
  const metadata: Partial<Metadata> = {};

  // Split into lines
  const lines = parmContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Extract SOLVENT (format: "SOLVENT            DMSO")
    if (trimmedLine.startsWith('SOLVENT')) {
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const solventText = parts[1];
        const solvent = extractSolventHTMLFromText(solventText);
        if (solvent) {
          metadata.solvent = solvent;
        }
      }
    }

    // Extract SFO1 (format: "SFO1        500.1730885 MHz")
    if (trimmedLine.startsWith('SFO1')) {
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const frequency = parseFloat(parts[1]);
        if (!isNaN(frequency)) {
          metadata.frequency = frequency;
        }
      }
    }

    // Extract NUC1 (format: "NUC1                 1H")
    if (trimmedLine.startsWith('NUC1')) {
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const nucleiText = parts[1];
        const nuclei = extractNucleiHTMLFromText(nucleiText);
        if (nuclei) {
          metadata.nuclei = nuclei;
        }
      }
    }
  }

  return metadata;
}
