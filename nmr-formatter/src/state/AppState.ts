/**
 * Application State Management
 * Central state container for the entire NMR Formatter application
 */

import { MetadataState } from './MetadataState';
import { TableState } from './TableState';
import { ValidationState } from './ValidationState';

export class AppState {
    public metadata: MetadataState;
    public table: TableState;
    public validation: ValidationState;
    private changeListeners: Array<() => void> = [];

    constructor() {
        this.metadata = new MetadataState();
        this.table = new TableState();
        this.validation = new ValidationState();

        // Propagate child state changes to app-level listeners
        this.metadata.onChange(() => this.notifyChange());
        this.table.onChange(() => this.notifyChange());
        this.validation.onChange(() => this.notifyChange());
    }

    /**
     * Register a listener for any state change
     */
    onChange(listener: () => void): void {
        this.changeListeners.push(listener);
    }

    /**
     * Clear all errors in validation state
     */
    clearAllErrors(): void {
        this.validation.clearAllErrors();
    }

    /**
     * Reset the entire application state
     */
    reset(): void {
        this.metadata = new MetadataState();
        this.table = new TableState();
        this.validation = new ValidationState();
        this.notifyChange();
    }

    private notifyChange(): void {
        this.changeListeners.forEach(listener => listener());
    }
}
