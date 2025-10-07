// NMR Data model

import { NMRPeak } from './NMRPeak';
import { Metadata } from './Metadata';
import { ValidationError } from '../core/types';

export class NMRData {
    peaks: NMRPeak[];
    metadata: Metadata;

    constructor(peaks: NMRPeak[] = [], metadata: Metadata = new Metadata()) {
        this.peaks = peaks;
        this.metadata = metadata;
    }

    addPeak(peak: NMRPeak): void {
        this.peaks.push(peak);
    }

    removePeak(index: number): void {
        if (index >= 0 && index < this.peaks.length) {
            this.peaks.splice(index, 1);
        }
    }

    updateMetadata(key: keyof Metadata, value: string | number): void {
        this.metadata[key] = value;
    }

    /**
     * Validate all peaks in this NMR data
     */
    validate(): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!this.peaks) {
            return [];
        }

        // Validate each peak (only J-value and multiplicity consistency)
        this.peaks.forEach((peak, index) => {
            const peakErrors = peak.validate();
            // Update index in errors
            peakErrors.forEach(error => {
                errors.push({ ...error, index });
            });
        });

        return errors;
    }
}
