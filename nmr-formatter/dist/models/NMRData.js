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
}
exports.NMRData = NMRData;
//# sourceMappingURL=NMRData.js.map