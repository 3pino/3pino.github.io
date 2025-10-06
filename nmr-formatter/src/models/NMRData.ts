// NMR Data model

import { NMRPeak } from './NMRPeak';
import { Metadata } from './Metadata';

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
}
