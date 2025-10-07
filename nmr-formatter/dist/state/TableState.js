"use strict";
/**
 * Table State Management
 * Manages NMR peak rows (shift, multiplicity, J-values, integration, assignment)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableState = void 0;
class TableState {
    constructor() {
        this.rows = [];
        this.maxJColumns = 0;
        this.changeListeners = [];
        // Initialize with one empty row
        this.addRow();
    }
    getRows() {
        return this.rows.map(row => (Object.assign({}, row)));
    }
    getMaxJColumns() {
        return this.maxJColumns;
    }
    addRow(data) {
        const id = this.generateId();
        const newRow = Object.assign({ id, shift: '', multiplicity: '', jValues: [], integration: 0, assignment: '' }, data);
        this.rows.push(newRow);
        this.recalculateMaxJ();
        this.notifyChange();
        return id;
    }
    updateRow(id, updates) {
        const row = this.rows.find(r => r.id === id);
        if (row) {
            Object.assign(row, updates);
            this.recalculateMaxJ();
            this.notifyChange();
        }
    }
    removeRow(id) {
        this.rows = this.rows.filter(r => r.id !== id);
        // Ensure at least one row exists
        if (this.rows.length === 0) {
            this.addRow();
        }
        else {
            this.recalculateMaxJ();
            this.notifyChange();
        }
    }
    removeRows(ids) {
        this.rows = this.rows.filter(r => !ids.includes(r.id));
        // Ensure at least one row exists
        if (this.rows.length === 0) {
            this.addRow();
        }
        else {
            this.recalculateMaxJ();
            this.notifyChange();
        }
    }
    getRow(id) {
        const row = this.rows.find(r => r.id === id);
        return row ? Object.assign({}, row) : undefined;
    }
    setMaxJColumns(maxJ) {
        this.maxJColumns = maxJ;
        this.notifyChange();
    }
    recalculateMaxJ() {
        // This will be called by the UI layer after calculating required J columns
        // For now, we just store the value
    }
    onChange(listener) {
        this.changeListeners.push(listener);
    }
    notifyChange() {
        this.changeListeners.forEach(listener => listener(this.getRows(), this.maxJColumns));
    }
    generateId() {
        return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.TableState = TableState;
//# sourceMappingURL=TableState.js.map