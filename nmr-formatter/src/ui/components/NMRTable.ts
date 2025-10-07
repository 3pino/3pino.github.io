/**
 * NMR Table Component
 * Manages the table UI for NMR peak data
 */

import { TableState, TableRowData } from '../../state/TableState';
import { ValidationState } from '../../state/ValidationState';

export class NMRTable {
    private tableState: TableState;
    private validationState: ValidationState;
    private tableBody: HTMLElement;
    private tableElement: HTMLElement;
    private selectAllCheckbox: HTMLInputElement;
    private maxJColumns: number = 0;

    // Row ID to TR element mapping
    private rowElements: Map<string, HTMLTableRowElement> = new Map();

    constructor(
        tableState: TableState,
        validationState: ValidationState,
        onMultiplicityChange: () => void,
        onNavigateToMetadata: (reverse: boolean) => void
    ) {
        this.tableState = tableState;
        this.validationState = validationState;
        this.tableBody = document.getElementById('nmr-table-body')!;
        this.tableElement = document.getElementById('nmr-table')!;
        this.selectAllCheckbox = document.getElementById('select-all-checkbox') as HTMLInputElement;

        this.initializeEventListeners(onMultiplicityChange, onNavigateToMetadata);
        this.renderTable();

        // Listen to state changes
        this.tableState.onChange((rows, maxJ) => {
            this.maxJColumns = maxJ;
            this.renderTable();
        });
    }

    private initializeEventListeners(
        onMultiplicityChange: () => void,
        onNavigateToMetadata: (reverse: boolean) => void
    ): void {
        // Select all checkbox
        this.selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = this.tableBody.querySelectorAll('.row-checkbox') as NodeListOf<HTMLInputElement>;
            checkboxes.forEach(cb => {
                cb.checked = this.selectAllCheckbox.checked;
            });
        });

        // Add peak button
        document.getElementById('add-peak-btn')?.addEventListener('click', () => {
            this.tableState.addRow();
        });

        // Remove peak button
        document.getElementById('remove-peak-btn')?.addEventListener('click', () => {
            const selectedIds: string[] = [];
            this.rowElements.forEach((tr, id) => {
                const checkbox = tr.querySelector('.row-checkbox') as HTMLInputElement;
                if (checkbox?.checked) {
                    selectedIds.push(id);
                }
            });

            if (selectedIds.length > 0) {
                this.tableState.removeRows(selectedIds);
                this.selectAllCheckbox.checked = false;
            }
        });
    }

    private renderTable(): void {
        const rows = this.tableState.getRows();

        // Clear existing rows
        this.tableBody.innerHTML = '';
        this.rowElements.clear();

        // Render each row
        rows.forEach(rowData => {
            const tr = this.createTableRow(rowData);
            this.rowElements.set(rowData.id, tr);
            this.tableBody.appendChild(tr);
        });

        // Update table header
        this.updateTableHeader();
    }

    private createTableRow(rowData: TableRowData): HTMLTableRowElement {
        const row = document.createElement('tr');
        row.setAttribute('data-row-id', rowData.id);

        // Checkbox cell
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'checkbox-cell';
        checkboxCell.innerHTML = '<input type="checkbox" class="row-checkbox">';
        row.appendChild(checkboxCell);

        // Chemical shift cell
        const shiftCell = document.createElement('td');
        const shiftInput = document.createElement('input');
        shiftInput.type = 'text';
        shiftInput.className = 'shift-input';
        shiftInput.placeholder = '0.00 or 7.53–7.50';
        shiftInput.value = rowData.shift;
        shiftCell.appendChild(shiftInput);
        this.setupShiftInput(shiftInput, rowData.id, row);
        row.appendChild(shiftCell);

        // Multiplicity cell
        const multCell = document.createElement('td');
        const multInput = document.createElement('input');
        multInput.type = 'text';
        multInput.className = 'mult-input';
        multInput.placeholder = 's, d, t...';
        multInput.value = rowData.multiplicity;
        multCell.appendChild(multInput);
        this.setupMultiplicityInput(multInput, rowData.id, row);
        row.appendChild(multCell);

        // J-value cells (10 max, dynamically shown/hidden)
        const MAX_J_CELLS = 10;
        for (let i = 0; i < MAX_J_CELLS; i++) {
            const jCell = document.createElement('td');
            jCell.className = 'j-input-cell';

            const jInput = document.createElement('input');
            jInput.type = 'number';
            jInput.step = '0.1';
            jInput.className = 'j-input';
            jInput.setAttribute('data-j-index', i.toString());
            jInput.placeholder = '0.0';

            if (i < rowData.jValues.length) {
                jInput.value = rowData.jValues[i].toString();
            }

            jCell.appendChild(jInput);
            this.setupJInput(jInput, rowData.id, i, row);

            // Initially hide all J cells
            jCell.style.display = 'none';
            row.appendChild(jCell);
        }

        // Integration cell
        const intCell = document.createElement('td');
        intCell.className = 'int-cell';
        const intInput = document.createElement('input');
        intInput.type = 'number';
        intInput.step = '1';
        intInput.className = 'int-input';
        intInput.placeholder = '1';
        if (rowData.integration) {
            intInput.value = rowData.integration.toString();
        }
        intCell.appendChild(intInput);
        this.setupIntegrationInput(intInput, rowData.id, row);
        row.appendChild(intCell);

        // Assignment cell
        const assignmentCell = document.createElement('td');
        assignmentCell.className = 'assignment-cell';
        const assignmentInput = document.createElement('div');
        assignmentInput.className = 'assignment-input';
        assignmentInput.setAttribute('contenteditable', 'true');
        assignmentInput.setAttribute('data-placeholder', 'e.g., H-8');
        assignmentInput.innerHTML = rowData.assignment;
        assignmentCell.appendChild(assignmentInput);
        this.setupAssignmentInput(assignmentInput, rowData.id, row);
        row.appendChild(assignmentCell);

        return row;
    }

    private setupShiftInput(input: HTMLInputElement, rowId: string, row: HTMLTableRowElement): void {
        input.addEventListener('input', () => {
            this.tableState.updateRow(rowId, { shift: input.value });
            this.validationState.clearError(`shift-${rowId}`);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            }
        });
    }

    private setupMultiplicityInput(input: HTMLInputElement, rowId: string, row: HTMLTableRowElement): void {
        input.addEventListener('input', () => {
            this.tableState.updateRow(rowId, { multiplicity: input.value });
            this.validationState.clearError(`mult-${rowId}`);

            // Recalculate J columns when multiplicity changes
            this.updateJColumnVisibility();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            }
        });
    }

    private setupJInput(input: HTMLInputElement, rowId: string, index: number, row: HTMLTableRowElement): void {
        input.addEventListener('input', () => {
            const rowData = this.tableState.getRow(rowId);
            if (rowData) {
                const jValues = [...rowData.jValues];
                const value = parseFloat(input.value);

                if (!isNaN(value)) {
                    jValues[index] = Math.abs(value); // Auto-correct to absolute

                    // Auto-sort J-values in descending order
                    jValues.sort((a, b) => b - a);
                    this.tableState.updateRow(rowId, { jValues });

                    // Update all J inputs with sorted values
                    this.updateJInputsForRow(row, jValues);
                }
            }
            this.validationState.clearError(`j${index}-${rowId}`);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            }
        });
    }

    private setupIntegrationInput(input: HTMLInputElement, rowId: string, row: HTMLTableRowElement): void {
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            this.tableState.updateRow(rowId, { integration: isNaN(value) ? 0 : value });
            this.validationState.clearError(`int-${rowId}`);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            }
        });
    }

    private setupAssignmentInput(input: HTMLElement, rowId: string, row: HTMLTableRowElement): void {
        // Paste filtering
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const clipboardData = (e as ClipboardEvent).clipboardData;
            const text = clipboardData?.getData('text/html') || clipboardData?.getData('text/plain') || '';
            const temp = document.createElement('div');
            temp.innerHTML = text;
            const filtered = this.filterHTMLTags(temp, ['B', 'I', 'SUB', 'SUP']);
            document.execCommand('insertHTML', false, filtered);
        });

        input.addEventListener('input', () => {
            const html = input.innerHTML.trim() === '' || input.innerHTML === '<br>' ? '' : input.innerHTML;
            this.tableState.updateRow(rowId, { assignment: html });
            this.validationState.clearError(`assignment-${rowId}`);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    const prevRow = row.previousElementSibling as HTMLTableRowElement | null;
                    if (prevRow) {
                        const prevAssignment = prevRow.querySelector('.assignment-input') as HTMLElement;
                        prevAssignment?.focus();
                    }
                } else {
                    const nextRow = row.nextElementSibling as HTMLTableRowElement | null;
                    if (nextRow) {
                        const nextShift = nextRow.querySelector('.shift-input') as HTMLInputElement;
                        nextShift?.focus();
                    } else {
                        // Last row: add new row
                        const newId = this.tableState.addRow();
                        setTimeout(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const firstInput = newRow.querySelector('.shift-input') as HTMLInputElement;
                                firstInput?.focus();
                            }
                        }, 50);
                    }
                }
            }

            // Keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    document.execCommand('bold');
                } else if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    document.execCommand('italic');
                }
            }
        });
    }

    private focusNextTableCell(currentInput: HTMLElement, currentRow: HTMLTableRowElement, reverse: boolean): void {
        const currentCell = currentInput.closest('td');
        if (!currentCell) return;

        const cellIndex = Array.from(currentRow.children).indexOf(currentCell);

        if (reverse) {
            // Move up
            let searchRow: HTMLTableRowElement | null = currentRow.previousElementSibling as HTMLTableRowElement;
            while (searchRow) {
                const targetCell = searchRow.children[cellIndex] as HTMLTableCellElement;
                if (targetCell) {
                    const targetInput = targetCell.querySelector('input:not([disabled]), [contenteditable="true"]') as HTMLElement;
                    if (targetInput && !(targetInput as HTMLInputElement).disabled) {
                        targetInput.focus();
                        return;
                    }
                }
                searchRow = searchRow.previousElementSibling as HTMLTableRowElement;
            }
        } else {
            // Move down
            let searchRow: HTMLTableRowElement | null = currentRow.nextElementSibling as HTMLTableRowElement;
            while (searchRow) {
                const targetCell = searchRow.children[cellIndex] as HTMLTableCellElement;
                if (targetCell) {
                    const targetInput = targetCell.querySelector('input:not([disabled]), [contenteditable="true"]') as HTMLElement;
                    if (targetInput && !(targetInput as HTMLInputElement).disabled) {
                        targetInput.focus();
                        return;
                    }
                }
                searchRow = searchRow.nextElementSibling as HTMLTableRowElement;
            }

            // No cell below: add new row
            const newId = this.tableState.addRow();
            setTimeout(() => {
                const newRow = this.rowElements.get(newId);
                if (newRow) {
                    const targetCell = newRow.children[cellIndex] as HTMLTableCellElement;
                    const targetInput = targetCell?.querySelector('input:not([disabled]), [contenteditable="true"]') as HTMLElement;
                    if (targetInput && !(targetInput as HTMLInputElement).disabled) {
                        targetInput.focus();
                    } else {
                        // Find first enabled input
                        const firstInput = newRow.querySelector('input:not([disabled]), [contenteditable="true"]') as HTMLElement;
                        firstInput?.focus();
                    }
                }
            }, 50);
        }
    }

    private updateJInputsForRow(row: HTMLTableRowElement, jValues: number[]): void {
        const jInputs = row.querySelectorAll('.j-input:not([disabled])') as NodeListOf<HTMLInputElement>;
        jInputs.forEach((input, index) => {
            if (index < jValues.length) {
                input.value = jValues[index].toString();
            }
        });
    }

    private updateJColumnVisibility(): void {
        const rows = this.tableState.getRows();

        // Calculate required J columns for each row
        const rowRequirements: number[] = [];
        rows.forEach(rowData => {
            const required = this.calculateRequiredJColumns(rowData.multiplicity);
            rowRequirements.push(required);
        });

        // Determine table-wide maximum
        const tableMaxJ = Math.max(0, ...rowRequirements);
        this.maxJColumns = tableMaxJ;

        // Update visibility for all rows
        this.rowElements.forEach((tr, rowId) => {
            const rowData = rows.find(r => r.id === rowId);
            if (!rowData) return;

            const jCells = tr.querySelectorAll('.j-input-cell') as NodeListOf<HTMLTableCellElement>;
            const requiredForRow = this.calculateRequiredJColumns(rowData.multiplicity);

            jCells.forEach((cell, cellIndex) => {
                const input = cell.querySelector('.j-input') as HTMLInputElement;

                if (cellIndex < requiredForRow) {
                    // Active cell
                    cell.style.display = '';
                    cell.classList.remove('disabled');
                    if (input) input.disabled = false;
                } else if (cellIndex < tableMaxJ) {
                    // Placeholder cell
                    cell.style.display = '';
                    cell.classList.add('disabled');
                    if (input) input.disabled = true;
                } else {
                    // Hidden cell
                    cell.style.display = 'none';
                    if (input) input.disabled = true;
                }
            });
        });

        this.updateTableHeader();
    }

    private calculateRequiredJColumns(multiplicity: string): number {
        if (!multiplicity || multiplicity.trim() === '') {
            return 0;
        }

        const multiplicityText = this.convertMultiplicityToText(multiplicity.trim());

        try {
            const jCounts = (window as any).multipletnumbers(multiplicityText);
            if (jCounts === null) {
                return 0;
            }
            return jCounts.length;
        } catch {
            return 0;
        }
    }

    private convertMultiplicityToText(input: string): string {
        if (!input || input.trim() === '') return '';

        const trimmed = input.trim();

        if (/^\d+$/.test(trimmed)) {
            const digitMap: { [key: string]: string } = {
                '1': 's',
                '2': 'd',
                '3': 't',
                '4': 'q',
                '5': 'quint'
            };

            let result = '';
            for (const digit of trimmed) {
                if (digit >= '1' && digit <= '5') {
                    result += digitMap[digit];
                }
            }
            return result;
        }

        return trimmed;
    }

    private updateTableHeader(): void {
        const thead = this.tableElement.querySelector('thead tr');
        if (!thead) return;

        // Remove existing J headers
        const existingJHeaders = thead.querySelectorAll('.j-header');
        existingJHeaders.forEach(header => header.remove());

        // Add J headers before Integration
        const intHeader = thead.querySelector('.integration-header');
        if (intHeader) {
            for (let i = 0; i < this.maxJColumns; i++) {
                const jHeader = document.createElement('th');
                jHeader.className = 'j-header';
                jHeader.textContent = `J${i + 1} (Hz)`;
                intHeader.insertAdjacentElement('beforebegin', jHeader);
            }
        }
    }

    private filterHTMLTags(element: Element, allowedTags: string[]): string {
        let result = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = (node as Element).tagName.toUpperCase();
                if (allowedTags.includes(tagName)) {
                    result += `<${tagName.toLowerCase()}>${this.filterHTMLTags(node as Element, allowedTags)}</${tagName.toLowerCase()}>`;
                } else {
                    result += this.filterHTMLTags(node as Element, allowedTags);
                }
            }
        });
        return result;
    }

    getFirstInput(): HTMLElement | null {
        const firstRow = this.tableBody.querySelector('tr');
        if (firstRow) {
            return firstRow.querySelector('.shift-input');
        }
        return null;
    }
}
