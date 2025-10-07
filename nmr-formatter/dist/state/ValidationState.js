"use strict";
/**
 * Validation State Management
 * Tracks validation errors for metadata and table fields
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationState = void 0;
class ValidationState {
    constructor() {
        this.errors = new Map();
        this.changeListeners = [];
    }
    hasError(fieldId) {
        return this.errors.has(fieldId);
    }
    getError(fieldId) {
        return this.errors.get(fieldId);
    }
    getAllErrors() {
        return new Map(this.errors);
    }
    setError(fieldId, message) {
        this.errors.set(fieldId, message);
        this.notifyChange();
    }
    clearError(fieldId) {
        this.errors.delete(fieldId);
        this.notifyChange();
    }
    clearAllErrors() {
        this.errors.clear();
        this.notifyChange();
    }
    hasAnyErrors() {
        return this.errors.size > 0;
    }
    onChange(listener) {
        this.changeListeners.push(listener);
    }
    notifyChange() {
        this.changeListeners.forEach(listener => listener(this.getAllErrors()));
    }
}
exports.ValidationState = ValidationState;
//# sourceMappingURL=ValidationState.js.map