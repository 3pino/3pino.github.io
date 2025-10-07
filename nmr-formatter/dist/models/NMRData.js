"use strict";
// NMR Data model
Object.defineProperty(exports, "__esModule", { value: true });
exports.NMRData = void 0;
const Metadata_1 = require("./Metadata");
class NMRData {
    constructor(peaks = [], metadata = new Metadata_1.Metadata()) {
        this.peaks = peaks;
        this.metadata = metadata;
    }
    addPeak(peak) {
        this.peaks.push(peak);
    }
    removePeak(index) {
        if (index >= 0 && index < this.peaks.length) {
            this.peaks.splice(index, 1);
        }
    }
    updateMetadata(key, value) {
        this.metadata[key] = value;
    }
    /**
     * Validate all peaks in this NMR data
     */
    validate() {
        const errors = [];
        if (!this.peaks) {
            return [];
        }
        // Validate each peak (only J-value and multiplicity consistency)
        this.peaks.forEach((peak, index) => {
            const peakErrors = peak.validate();
            // Update index in errors
            peakErrors.forEach(error => {
                errors.push(Object.assign(Object.assign({}, error), { index }));
            });
        });
        return errors;
    }
}
exports.NMRData = NMRData;
//# sourceMappingURL=NMRData.js.map