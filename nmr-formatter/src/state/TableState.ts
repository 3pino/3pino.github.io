/**
 * Table State Management
 * Manages NMR peak rows (shift, multiplicity, J-values, integration, assignment)
 */

export interface TableRowData {
    id: string;
    shift: string;
    multiplicity: string;
    jValues: number[];
    integration: number;
    assignment: string;
}

export class TableState {
    private rows: TableRowData[] = [];
    private maxJColumns: number = 0;
    private changeListeners: Array<(rows: TableRowData[], maxJ: number) => void> = [];

    constructor() {
        // Initialize with one empty row
        this.addRow();
    }

    getRows(): TableRowData[] {
        return this.rows.map(row => ({ ...row }));
    }

    getMaxJColumns(): number {
        return this.maxJColumns;
    }

    addRow(data?: Partial<TableRowData>): string {
        const id = this.generateId();
        const newRow: TableRowData = {
            id,
            shift: '',
            multiplicity: '',
            jValues: [],
            integration: 0,
            assignment: '',
            ...data
        };
        this.rows.push(newRow);
        this.recalculateMaxJ();
        this.notifyChange();
        return id;
    }

    updateRow(id: string, updates: Partial<TableRowData>): void {
        const row = this.rows.find(r => r.id === id);
        if (row) {
            Object.assign(row, updates);
            this.recalculateMaxJ();
            this.notifyChange();
        }
    }

    removeRow(id: string): void {
        this.rows = this.rows.filter(r => r.id !== id);

        // Ensure at least one row exists
        if (this.rows.length === 0) {
            this.addRow();
        } else {
            this.recalculateMaxJ();
            this.notifyChange();
        }
    }

    removeRows(ids: string[]): void {
        this.rows = this.rows.filter(r => !ids.includes(r.id));

        // Ensure at least one row exists
        if (this.rows.length === 0) {
            this.addRow();
        } else {
            this.recalculateMaxJ();
            this.notifyChange();
        }
    }

    removeEmptyRows(): void {
        const emptyRowIds = this.rows
            .filter(row => {
                return row.shift.trim() === '' && 
                       row.multiplicity.trim() === '' && 
                       row.jValues.every(j => j === 0) &&
                       row.integration === 0 &&
                       row.assignment.trim() === '';
            })
            .map(row => row.id);

        if (emptyRowIds.length > 0) {
            this.removeRows(emptyRowIds);
        }
    }

    sortAllJValues(): void {
        this.rows.forEach(row => {
            if (row.jValues.length > 0) {
                row.jValues = [...row.jValues].sort((a, b) => b - a);
            }
        });
        this.notifyChange();
    }

    getRow(id: string): TableRowData | undefined {
        const row = this.rows.find(r => r.id === id);
        return row ? { ...row } : undefined;
    }

    setMaxJColumns(maxJ: number): void {
        this.maxJColumns = maxJ;
        this.notifyChange();
    }

    private recalculateMaxJ(): void {
        // This will be called by the UI layer after calculating required J columns
        // For now, we just store the value
    }

    onChange(listener: (rows: TableRowData[], maxJ: number) => void): void {
        this.changeListeners.push(listener);
    }

    private notifyChange(): void {
        this.changeListeners.forEach(listener => listener(this.getRows(), this.maxJColumns));
    }

    private generateId(): string {
        return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
