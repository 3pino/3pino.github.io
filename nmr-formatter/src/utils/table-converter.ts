// NMR Table Converter
// Bidirectional conversion between NMRData and table structure (array of arrays)

import { NMRPeak } from '../models/NMRPeak';
import { NMRData } from '../models/NMRData';
import { Metadata } from '../models/Metadata';
import { Logger } from '../core/logger';
import { NucleiType, SolventType } from '../core/types';

// Helper function to determine maximum number of J-values across all peaks
function getMaxJValues(peaks: NMRPeak[]): number {
    return Math.max(0, ...peaks.map(peak => peak.jValues.length));
}

// Convert NMRData to table structure (array of arrays)
export function dataToTable(data: NMRData): string[][] {
    if (!data || !data.peaks || data.peaks.length === 0) {
        return [];
    }

    Logger.debug('Converting NMR data to table:', data);

    const maxJValues = getMaxJValues(data.peaks);
    const table: string[][] = [];

    // Create header row with dynamic J-value columns
    const headers = ["Chemical Shift", "Multiplicity"];

    // Add J-value columns dynamically
    for (let i = 1; i <= maxJValues; i++) {
        headers.push(`J${i} (Hz)`);
    }

    // Add integration column for 1H NMR
    const is1HNMR = data.metadata.nuclei === "1H" || data.metadata.nuclei === "";
    if (is1HNMR) {
        headers.push("Integration (H)");
    }

    table.push(headers);

    // Add data rows
    data.peaks.forEach(peak => {
        const row: string[] = [];

        // Chemical shift
        if (Array.isArray(peak.chemicalShift)) {
            row.push(`${peak.chemicalShift[0]}–${peak.chemicalShift[1]}`);
        } else {
            row.push(peak.chemicalShift.toString());
        }

        // Multiplicity
        row.push(peak.multiplicity || "");

        // J-values (fill empty columns with empty strings)
        for (let i = 0; i < maxJValues; i++) {
            if (i < peak.jValues.length) {
                row.push(peak.jValues[i].toString());
            } else {
                row.push("");
            }
        }

        // Integration (only for 1H NMR)
        if (is1HNMR) {
            if (typeof peak.integration === 'number') {
                row.push(peak.integration > 0 ? peak.integration.toString() : "");
            } else {
                row.push(peak.integration || "");
            }
        }

        table.push(row);
    });

    Logger.debug('Generated table:', table);
    return table;
}

// Convert table structure back to NMRData
export function tableToData(table: string[][], metadata: Partial<Metadata> = {}): NMRData {
    if (!table || table.length < 2) {
        // Return empty NMRData if table is invalid
        const completeMetadata = new Metadata(
            metadata.nuclei || "" as NucleiType,
            metadata.solvent || "" as SolventType,
            metadata.frequency || 0
        );
        return new NMRData([], completeMetadata);
    }

    Logger.debug('Converting table to NMR data:', table);

    const headers = table[0];
    const dataRows = table.slice(1);
    const peaks: NMRPeak[] = [];

    // Determine if this is 1H NMR based on headers
    const hasIntegration = headers.some(h => h.toLowerCase().includes("integration"));
    const is1HNMR = hasIntegration || metadata.nuclei === "1H" || metadata.nuclei === "";

    // Find column indices
    const shiftIndex = headers.findIndex(h => h.toLowerCase().includes("shift"));
    const multIndex = headers.findIndex(h => h.toLowerCase().includes("multiplicity"));
    const integrationIndex = hasIntegration ? headers.findIndex(h => h.toLowerCase().includes("integration")) : -1;

    // Find J-value column indices
    const jValueIndices: number[] = [];
    headers.forEach((header, index) => {
        if (header.toLowerCase().includes("j") && header.toLowerCase().includes("hz")) {
            jValueIndices.push(index);
        }
    });

    Logger.debug('Column indices - shift:', shiftIndex, 'mult:', multIndex, 'integration:', integrationIndex, 'jValues:', jValueIndices);

    // Process each data row
    dataRows.forEach((row, rowIndex) => {
        if (row.length === 0 || (shiftIndex >= 0 && !row[shiftIndex])) {
            Logger.debug('Skipping empty row:', rowIndex);
            return;
        }

        try {
            // Parse chemical shift
            let chemicalShift: number | [number, number];
            const shiftStr = shiftIndex >= 0 ? row[shiftIndex].trim() : "";

            if (shiftStr.includes("–") || shiftStr.includes("-")) {
                // Range format
                const parts = shiftStr.split(/[–-]/).map(p => parseFloat(p.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    chemicalShift = [parts[0], parts[1]];
                } else {
                    Logger.debug('Invalid range format in row:', rowIndex, shiftStr);
                    return;
                }
            } else {
                // Single value
                const shiftVal = parseFloat(shiftStr);
                if (isNaN(shiftVal)) {
                    Logger.debug('Invalid chemical shift in row:', rowIndex, shiftStr);
                    return;
                }
                chemicalShift = shiftVal;
            }

            // Parse multiplicity
            const multiplicity = multIndex >= 0 ? row[multIndex].trim() : "";

            // Parse J-values
            const jValues: number[] = [];
            jValueIndices.forEach(index => {
                if (index < row.length && row[index].trim()) {
                    const jVal = parseFloat(row[index].trim());
                    if (!isNaN(jVal)) {
                        jValues.push(jVal);
                    }
                }
            });

            // Parse integration
            let integration = 0;
            if (is1HNMR && integrationIndex >= 0 && integrationIndex < row.length && row[integrationIndex].trim()) {
                const intVal = parseFloat(row[integrationIndex].trim());
                if (!isNaN(intVal)) {
                    integration = intVal;
                }
            }

            const peak = new NMRPeak(chemicalShift, multiplicity, jValues, integration);
            peaks.push(peak);
            Logger.debug('Parsed peak from row:', rowIndex, peak);

        } catch (error) {
            Logger.debug('Error parsing row:', rowIndex, error);
        }
    });

    const completeMetadata = new Metadata(
        metadata.nuclei || "" as NucleiType,
        metadata.solvent || "" as SolventType,
        metadata.frequency || 0
    );
    const result = new NMRData(peaks, completeMetadata);
    Logger.debug('Generated NMR data from table:', result);
    return result;
}

// Export helper function
export { getMaxJValues };
