/**
 * NMR Table Component
 * Manages the table UI for NMR peak data
 */

import { TableState, TableRowData } from '../../state/TableState';
import { ValidationState } from '../../state/ValidationState';
import { KeyboardNav } from '../navigation/KeyboardNav';

export class NMRTable {
    private tableState: TableState;
    private validationState: ValidationState;
    private tableBody: HTMLElement;
    private tableElement: HTMLElement;
    private keyboardNav: KeyboardNav;
    
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
        this.tableElement = document.getElementById('nmr-table')!
        this.keyboardNav = new KeyboardNav();
        this.initializeEventListeners(onMultiplicityChange, onNavigateToMetadata);
        this.renderTable();

        // Listen to state changes
        this.tableState.onChange((rows, maxJ) => {
            // Only re-render if rows were added/removed
            // For updates to existing rows, the DOM is already updated via event handlers
            const currentRowCount = this.rowElements.size;
            const newRowCount = rows.length;

            if (currentRowCount !== newRowCount) {
                this.maxJColumns = maxJ;
                this.renderTable();
            }
        });
    }

    private initializeEventListeners(
        onMultiplicityChange: () => void,
        onNavigateToMetadata: (reverse: boolean) => void
    ): void {
        // Add row footer cell
        this.renderAddRowFooter();
    }

    private renderAddRowFooter(): void {
        // Remove existing add-row if present
        const existingAddRow = this.tableBody.querySelector('.add-row-footer');
        if (existingAddRow) {
            existingAddRow.remove();
        }
        
        const addRow = document.createElement('tr');
        addRow.className = 'add-row-footer';
        
        // Empty delete cell
        const deleteCell = document.createElement('td');
        deleteCell.className = 'delete-cell';
        addRow.appendChild(deleteCell);
        
        // Calculate remaining columns (shift + mult + J columns + integration + assignment)
        const remainingColumns = 4 + this.maxJColumns;
        
        const addCell = document.createElement('td');
        addCell.className = 'add-row-cell';
        addCell.colSpan = remainingColumns;
        addCell.innerHTML = '<button class="add-row-btn" title="Add new row">+</button>';
        
        const addButton = addCell.querySelector('.add-row-btn') as HTMLButtonElement;
        addButton.addEventListener('click', () => {
            const newId = this.tableState.addRow();
            setTimeout(() => {
                const newRow = this.rowElements.get(newId);
                if (newRow) {
                    const firstInput = newRow.querySelector('.shift-input') as HTMLInputElement;
                    firstInput?.focus();
                }
            }, 50);
        });
        
        addRow.appendChild(addCell);
        this.tableBody.appendChild(addRow);
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

        // Update J column visibility to preserve table state
        this.updateJColumnVisibility();
        
        // Re-render footer to update column span
        this.renderAddRowFooter();
    }

    private createTableRow(rowData: TableRowData): HTMLTableRowElement {
        const row = document.createElement('tr');
        row.setAttribute('data-row-id', rowData.id);

        // Delete button cell
        const deleteCell = document.createElement('td');
        deleteCell.className = 'delete-cell';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Delete this row';
        deleteBtn.tabIndex = -1;
        deleteCell.appendChild(deleteBtn);
        this.setupDeleteButton(deleteBtn, rowData.id);
        row.appendChild(deleteCell);

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
            jInput.type = 'text';
            jInput.className = 'j-input';
            jInput.setAttribute('data-j-index', i.toString());
            jInput.setAttribute('inputmode', 'decimal');
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
        intInput.type = 'text';
        intInput.className = 'int-input';
        intInput.setAttribute('inputmode', 'decimal');
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
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling;
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        setTimeout(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const targetInput = newRow.querySelector('.shift-input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        }, 50);
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
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
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling;
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        setTimeout(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const targetInput = newRow.querySelector('.mult-input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        }, 50);
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
            }
        });
    }

    private setupJInput(input: HTMLInputElement, rowId: string, index: number, row: HTMLTableRowElement): void {
        input.addEventListener('input', () => {
            // Filter to allow only numbers and ONE decimal point
            let filtered = input.value.replace(/[^0-9.]/g, '');
            
            // Allow only one decimal point
            const parts = filtered.split('.');
            if (parts.length > 2) {
                filtered = parts[0] + '.' + parts.slice(1).join('');
            }
            
            if (filtered !== input.value) {
                input.value = filtered;
            }

            const rowData = this.tableState.getRow(rowId);
            if (rowData) {
                const jValues = [...rowData.jValues];
                const value = parseFloat(input.value);

                if (!isNaN(value)) {
                    jValues[index] = Math.abs(value); // Auto-correct to absolute
                    // Don't sort during input - only update state
                    this.tableState.updateRow(rowId, { jValues });
                }
            }
            this.validationState.clearError(`j${index}-${rowId}`);
        });

        // J-value sorting removed - will be handled when Generate Text is clicked

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling;
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        setTimeout(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const cellIndex = Array.from(row.children).indexOf(input.closest('td')!);
                                const targetCell = newRow.children[cellIndex] as HTMLTableCellElement;
                                const targetInput = targetCell?.querySelector('input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        }, 50);
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
            }
        });
    }

    private setupIntegrationInput(input: HTMLInputElement, rowId: string, row: HTMLTableRowElement): void {
        input.addEventListener('input', () => {
            // Filter to allow only numbers and ONE decimal point
            let filtered = input.value.replace(/[^0-9.]/g, '');
            
            // Allow only one decimal point
            const parts = filtered.split('.');
            if (parts.length > 2) {
                filtered = parts[0] + '.' + parts.slice(1).join('');
            }
            
            if (filtered !== input.value) {
                input.value = filtered;
            }

            const value = parseFloat(input.value);
            this.tableState.updateRow(rowId, { integration: isNaN(value) ? 0 : value });
            this.validationState.clearError(`int-${rowId}`);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling;
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        setTimeout(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const targetInput = newRow.querySelector('.int-input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        }, 50);
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
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
                        const nextAssignment = nextRow.querySelector('.assignment-input') as HTMLElement;
                        nextAssignment?.focus();
                    } else {
                        // Last row: add new row
                        const newId = this.tableState.addRow();
                        setTimeout(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const newAssignment = newRow.querySelector('.assignment-input') as HTMLElement;
                                newAssignment?.focus();
                            }
                        }, 50);
                    }
                }
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling;
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        setTimeout(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const nextAssignment = newRow.querySelector('.assignment-input') as HTMLElement;
                                nextAssignment?.focus();
                            }
                        }, 50);
                        return;
                    }
                }

                // Check if ArrowRight at end of text
                if (e.key === 'ArrowRight') {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        const isAtEnd = this.isCaretAtEnd(input);
                        
                        if (isAtEnd) {
                            e.preventDefault();
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
                            return;
                        }
                    }
                }

                // Handle arrow key navigation for contenteditable
                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
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

        // Ensure placeholder shows when field is empty on blur
        input.addEventListener('blur', () => {
            const html = input.innerHTML.trim();
            if (html === '' || html === '<br>') {
                input.innerHTML = '';
            }
        });
    }

    private setupDeleteButton(button: HTMLButtonElement, rowId: string): void {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.tableState.removeRows([rowId]);
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

    private isCaretAtEnd(element: HTMLElement): boolean {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        
        // Check if selection is collapsed (cursor, not selection)
        if (!range.collapsed) return false;
        
        // Create a range from current position to end of element
        const testRange = document.createRange();
        testRange.selectNodeContents(element);
        testRange.setStart(range.endContainer, range.endOffset);
        
        // If range is empty, we're at the end
        return testRange.toString().length === 0;
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
