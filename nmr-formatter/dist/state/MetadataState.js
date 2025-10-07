"use strict";
/**
 * Metadata State Management
 * Manages nuclei, solvent, frequency, precision, and sort order
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataState = void 0;
class MetadataState {
    constructor(initialData) {
        this.changeListeners = [];
        this.data = Object.assign({ nuclei: '<sup>1</sup>H', solvent: '', frequency: NaN, shiftPrecision: 3, jPrecision: 2, sortOrder: 'desc' }, initialData);
    }
    getData() {
        return Object.assign({}, this.data);
    }
    update(updates) {
        this.data = Object.assign(Object.assign({}, this.data), updates);
        this.notifyChange();
    }
    setNuclei(nuclei) {
        this.data.nuclei = nuclei;
        this.notifyChange();
    }
    setSolvent(solvent) {
        this.data.solvent = solvent;
        this.notifyChange();
    }
    setFrequency(frequency) {
        this.data.frequency = frequency;
        this.notifyChange();
    }
    setShiftPrecision(precision) {
        this.data.shiftPrecision = precision;
        this.notifyChange();
    }
    setJPrecision(precision) {
        this.data.jPrecision = precision;
        this.notifyChange();
    }
    setSortOrder(order) {
        this.data.sortOrder = order;
        this.notifyChange();
    }
    onChange(listener) {
        this.changeListeners.push(listener);
    }
    notifyChange() {
        this.changeListeners.forEach(listener => listener(this.getData()));
    }
}
exports.MetadataState = MetadataState;
//# sourceMappingURL=MetadataState.js.map