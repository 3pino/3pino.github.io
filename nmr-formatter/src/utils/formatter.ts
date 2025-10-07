// NMR Formatter
// Converts structured NMRData objects into HTML-formatted academic text

import { NMRPeak } from '../models/NMRPeak';
import { NMRData } from '../models/NMRData';
import { Metadata } from '../models/Metadata';
import { Logger } from '../core/logger';

// Helper function to format chemical shift values with significant figures
function formatChemicalShift(shift: number | [number, number], significantFigures: number = 3): string {
    if (Array.isArray(shift)) {
        // Range format with en-dash
        return `${formatSignificantFigures(shift[0], significantFigures)}–${formatSignificantFigures(shift[1], significantFigures)}`;
    }
    return formatSignificantFigures(shift, significantFigures);
}

// Helper function to format number with significant figures
function formatSignificantFigures(num: number, sigFigs: number): string {
    if (num === 0) return '0';
    
    // Get the magnitude (order of 10)
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    
    // Calculate decimal places needed for the significant figures
    const decimalPlaces = Math.max(0, sigFigs - magnitude - 1);
    
    return num.toFixed(decimalPlaces);
}

// Helper function to format J-values with italics and significant figures
function formatJValues(jValues: number[], significantFigures: number = 2): string {
    if (jValues.length === 0) return "";

    const jString = jValues.map(j => formatSignificantFigures(j, significantFigures)).join(", ");
    return ` <I>J</I> = ${jString} Hz`;
}

// Helper function to format integration with function overloads for type safety
function formatIntegration(integration: number, decimalPlaces?: number, nuclei?: string): string;
function formatIntegration(integration: string, decimalPlaces?: number, nuclei?: string): string;
function formatIntegration(integration: number | string, decimalPlaces: number = 1, nuclei: string = "1H"): string {
    // Handle empty/zero values
    if (integration === 0 || integration === "" || integration === null || integration === undefined) {
        return "";
    }

    // Extract the atom symbol from nuclei (e.g., "1H" -> "H", "13C" -> "C", "<sup>1</sup>H" -> "H")
    const nucleiText = nuclei.replace(/<[^>]+>/g, ""); // Remove HTML tags
    const atomSymbol = nucleiText.replace(/\d+/g, "") || "H"; // Remove all numbers

    // Handle string integration values
    if (typeof integration === "string") {
        const trimmed = integration.trim();
        if (trimmed === "") return "";

        // Try to parse as number for decimal formatting
        const parsed = parseFloat(trimmed);
        if (!isNaN(parsed)) {
            if (parsed === 0) return "";
            return `, ${parsed.toFixed(decimalPlaces)}${atomSymbol}`;
        }

        // If it's already formatted (contains atom symbols), return as is with comma
        if (/[A-Z]/.test(trimmed)) {
            return trimmed.startsWith(',') ? trimmed : `, ${trimmed}`;
        }

        // Otherwise, treat as raw integration string and add atom symbol
        return `, ${trimmed}${atomSymbol}`;
    }

    // Handle number integration values with precise decimal formatting
    if (integration === 0) return "";
    return `, ${integration.toFixed(decimalPlaces)}${atomSymbol}`;
}

// Helper function to format multiplicity
function formatMultiplicity(multiplicity: string): string {
    if (!multiplicity) return "";
    return multiplicity;
}

// Helper function to format assignment
function formatAssignment(assignment: string): string {
    if (!assignment || assignment.trim() === "") return "";
    return assignment.trim();
}

// Helper function to format a single peak
function formatSinglePeak(peak: NMRPeak, shiftSigFigs: number = 3, jValueSigFigs: number = 2, integrationDecimalPlaces: number = 0, nuclei: string = "1H"): string {
    const shift = formatChemicalShift(peak.chemicalShift, shiftSigFigs);
    const mult = formatMultiplicity(peak.multiplicity);
    const jValues = formatJValues(peak.jValues, jValueSigFigs);
    const integration = formatIntegration(peak.integration as any, integrationDecimalPlaces, nuclei);
    const assignment = formatAssignment(peak.assignment);

    // Build the peak string: δ shift (multiplicity, J-values, integration, assignment)
    let peakStr = shift;

    if (mult || jValues || integration || assignment) {
        peakStr += " (";

        const parts = [];
        if (mult) parts.push(mult);
        if (jValues) parts.push(jValues.trim());
        if (integration) parts.push(integration.replace(", ", ""));
        if (assignment) parts.push(assignment);

        peakStr += parts.join(", ");
        peakStr += ")";
    }

    return peakStr;
}

// Helper function to format metadata section
function formatMetadata(metadata: Metadata): string {
    const parts = [];

    // Nuclei with superscript
    if (metadata.nuclei) {
        let nucleiFormatted = metadata.nuclei as string;
        // Apply superscript formatting for nuclei numbers
        nucleiFormatted = nucleiFormatted.replace(/^(\d+)/, "<sup>$1</sup>");
        parts.push(`${nucleiFormatted} NMR`);
    }

    // Solvent with subscript formatting
    if (metadata.solvent) {
        let solventFormatted = metadata.solvent as string;
        // Apply subscript formatting for numbers in solvent names
        solventFormatted = solventFormatted.replace(/(\d+)/g, "<sub>$1</sub>");
        parts.push(`(${solventFormatted}`);
    }

    // Frequency
    if (metadata.frequency && !isNaN(metadata.frequency)) {
        const freqPart = parts.length > 1 ? `, ${metadata.frequency} MHz)` : `(${metadata.frequency} MHz)`;
        if (parts.length > 1) {
            parts[parts.length - 1] += freqPart;
        } else {
            parts.push(freqPart);
        }
    } else if (metadata.solvent) {
        // Close the solvent parentheses if no frequency
        parts[parts.length - 1] += ")";
    }

    return parts.join(" ");
}

// Main formatting function
export function generateFormattedText(data: NMRData, shiftSigFigs: number = 3, jValueSigFigs: number = 2, integrationDecimalPlaces: number = 0): string {
    if (!data || !data.peaks || data.peaks.length === 0) {
        return "";
    }

    Logger.debug('Formatting NMR data:', data);

    const result = [];

    // Add metadata section
    const metadataStr = formatMetadata(data.metadata);
    if (metadataStr) {
        result.push(metadataStr);
    }

    // Add delta symbol and peaks
    const nuclei = data.metadata?.nuclei || "1H";
    const peakStrings = data.peaks.map(peak => formatSinglePeak(peak, shiftSigFigs, jValueSigFigs, integrationDecimalPlaces, nuclei));
    const peaksSection = "δ " + peakStrings.join(", ");
    result.push(peaksSection);

    // Join with space
    const formattedText = result.join(" ");

    Logger.debug('Generated formatted text:', formattedText);

    return formattedText;
}

// Export helper functions
export { formatChemicalShift, formatJValues, formatIntegration, formatMultiplicity, formatAssignment, formatSinglePeak, formatMetadata };
