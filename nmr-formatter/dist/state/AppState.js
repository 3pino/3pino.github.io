"use strict";
/**
 * Application State Management
 * Central state container for the entire NMR Formatter application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppState = void 0;
const MetadataState_1 = require("./MetadataState");
const TableState_1 = require("./TableState");
const ValidationState_1 = require("./ValidationState");
class AppState {
    constructor() {
        this.changeListeners = [];
        this.metadata = new MetadataState_1.MetadataState();
        this.table = new TableState_1.TableState();
        this.validation = new ValidationState_1.ValidationState();
        // Propagate child state changes to app-level listeners
        this.metadata.onChange(() => this.notifyChange());
        this.table.onChange(() => this.notifyChange());
        this.validation.onChange(() => this.notifyChange());
    }
    /**
     * Register a listener for any state change
     */
    onChange(listener) {
        this.changeListeners.push(listener);
    }
    /**
     * Clear all errors in validation state
     */
    clearAllErrors() {
        this.validation.clearAllErrors();
    }
    /**
     * Reset the entire application state
     */
    reset() {
        this.metadata = new MetadataState_1.MetadataState();
        this.table = new TableState_1.TableState();
        this.validation = new ValidationState_1.ValidationState();
        this.notifyChange();
    }
    notifyChange() {
        this.changeListeners.forEach(listener => listener());
    }
}
exports.AppState = AppState;
//# sourceMappingURL=AppState.js.map