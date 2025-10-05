"use strict";
// NMR Peak model
Object.defineProperty(exports, "__esModule", { value: true });
exports.NMRPeak = void 0;
class NMRPeak {
    constructor(chemicalShift = 0, multiplicity = "", jValues = [], integration = 0, assignment = "") {
        this.chemicalShift = chemicalShift;
        this.multiplicity = multiplicity;
        this.jValues = jValues;
        this.integration = integration;
        this.assignment = assignment;
    }
    // Convenience getter/setter for compatibility with app.js
    get shift() {
        return typeof this.chemicalShift === 'number' ? this.chemicalShift : this.chemicalShift[0];
    }
    set shift(value) {
        this.chemicalShift = value;
    }
}
exports.NMRPeak = NMRPeak;
//# sourceMappingURL=NMRPeak.js.map