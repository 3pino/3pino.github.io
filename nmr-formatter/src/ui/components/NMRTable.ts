/**
 * NMR Table Component
 * Manages the table UI for NMR peak data
 */

import { TableState, TableRowData } from '../../state/TableState';
import { ValidationState } from '../../state/ValidationState';
import { KeyboardNav } from '../navigation/KeyboardNav';
import { isTSVData } from '../../utils/tsv-parser';
import { filterNumericInput, filterHTMLTags } from '../../utils/validators/input-filters';

export class NMRTable {
    private tableState: TableState;
    private validationState: ValidationState;
    private tableBody: HTMLElement;
    private tableElement: HTMLElement;
    private keyboardNav: KeyboardNav;
    
    private maxJColumns: number = 0;

    // Row ID to TR element mapping
    private rowElements: Map<string, HTMLTableRowElement> = new Map();
    
    // AbortController for cleaning up event listeners
    private abortController: AbortController = new AbortController();

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

        // Listen to validation state changes
        this.validationState.onChange((errors) => {
            this.rowElements.forEach((tr, rowId) => {
                // Shift input
                const shiftInput = tr.querySelector('.shift-input') as HTMLInputElement;
                if (shiftInput) {
                    if (errors.has(`shift-${rowId}`)) {
                        shiftInput.classList.add('error');
                    } else {
                        shiftInput.classList.remove('error');
                    }
                }

                // Multiplicity input
                const multInput = tr.querySelector('.mult-input') as HTMLInputElement;
                if (multInput) {
                    if (errors.has(`mult-${rowId}`)) {
                        multInput.classList.add('error');
                    } else {
                        multInput.classList.remove('error');
                    }
                }

                // Integration input
                const intInput = tr.querySelector('.int-input') as HTMLInputElement;
                if (intInput) {
                    if (errors.has(`int-${rowId}`)) {
                        intInput.classList.add('error');
                    } else {
                        intInput.classList.remove('error');
                    }
                }

                // J-value inputs
                const jInputs = tr.querySelectorAll('.j-input') as NodeListOf<HTMLInputElement>;
                jInputs.forEach((jInput, index) => {
                    if (errors.has(`j${index}-${rowId}`)) {
                        jInput.classList.add('error');
                    } else {
                        jInput.classList.remove('error');
                    }
                });

                // Assignment input
                const assignmentInput = tr.querySelector('.assignment-input') as HTMLElement;
                if (assignmentInput) {
                    if (errors.has(`assignment-${rowId}`)) {
                        assignmentInput.classList.add('error');
                    } else {
                        assignmentInput.classList.remove('error');
                    }
                }
            });
        });
    }

    /**
     * Get the column type from a cell element
     * @param cell - The cell element (td or the input element inside it)
     * @returns Column type string (e.g., 'shift', 'multiplicity', 'j-0', 'integration', 'assignment') or null
     */
    private getCellColumnType(cell: HTMLElement): string | null {
        // If cell is an input element, get its parent td
        const tdElement = cell.tagName === 'TD' ? cell : cell.closest('td');
        if (!tdElement) return null;

        // Check for shift input
        if (tdElement.querySelector('.shift-input')) return 'shift';
        
        // Check for multiplicity input
        if (tdElement.querySelector('.mult-input')) return 'multiplicity';
        
        // Check for J input
        const jInput = tdElement.querySelector('.j-input');
        if (jInput) {
            const jIndex = jInput.getAttribute('data-j-index');
            return jIndex !== null ? `j-${jIndex}` : null;
        }
        
        // Check for integration input
        if (tdElement.querySelector('.int-input')) return 'integration';
        
        // Check for assignment input
        if (tdElement.querySelector('.assignment-input')) return 'assignment';
        
        return null;
    }

    /**
     * Handle TSV paste operation
     * @param startElement - The input element where paste was initiated
     * @param startRow - The row where paste was initiated
     * @param tsvText - The TSV text to paste
     */
    private async handleTSVPaste(startElement: HTMLElement, startRow: HTMLTableRowElement, tsvText: string): Promise<void> {
        console.log('[TSV Paste] Starting with text:', tsvText);
        
        // Parse TSV data
        const rows = tsvText.split(/\r?\n/).map(line => line.split('\t'));
        console.log('[TSV Paste] Parsed into rows:', rows.length, rows);
        
        // Filter out empty rows
        const validRows = rows.filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
        console.log('[TSV Paste] Valid rows:', validRows.length, validRows);
        
        // Get the starting cell and determine which column we're starting from
        const startCell = startElement.closest('td');
        if (!startCell) {
            console.log('[TSV Paste] No start cell found');
            return;
        }
        
        // Get the column index of the start cell
        const startCells = Array.from(startRow.querySelectorAll('td'));
        const startColumnIndex = startCells.indexOf(startCell as HTMLTableCellElement);
        console.log('[TSV Paste] Start column index in row:', startColumnIndex);
        
        // Get all table rows
        let currentRow: HTMLTableRowElement | null = startRow;
        
        // Process each TSV row
        for (let rowIdx = 0; rowIdx < validRows.length; rowIdx++) {
            const tsvRow = validRows[rowIdx];
            console.log(`[TSV Paste] Processing row ${rowIdx}/${validRows.length}:`, tsvRow);
            
            // If we need more rows, add them
            if (!currentRow) {
                console.log('[TSV Paste] Current row is null, adding new row');
                const newId = this.tableState.addRow();
                // Wait for the row to be rendered
                await new Promise<void>(resolve => {
                    requestAnimationFrame(() => {
                        const newRowElement = this.rowElements.get(newId);
                        if (newRowElement) {
                            console.log('[TSV Paste] New row rendered, applying data');
                            // Find the corresponding cell in the new row at the same column index
                            const newRowCells = Array.from(newRowElement.querySelectorAll('td'));
                            const newStartCell = newRowCells[startColumnIndex];
                            if (newStartCell) {
                                this.applyTSVRowDataSequentially(newRowElement, newStartCell as HTMLElement, tsvRow).then(resolve);
                            } else {
                                console.log('[TSV Paste] Could not find start cell in new row');
                                resolve();
                            }
                        } else {
                            console.log('[TSV Paste] New row not found in rowElements');
                            resolve();
                        }
                    });
                });
            } else {
                console.log('[TSV Paste] Applying data to existing row');
                // For existing rows, find the start cell at the same column index
                const rowCells = Array.from(currentRow.querySelectorAll('td'));
                const rowStartCell = rowCells[startColumnIndex];
                if (rowStartCell) {
                    await this.applyTSVRowDataSequentially(currentRow, rowStartCell as HTMLElement, tsvRow);
                }
                
                // Move to next row
                const nextRow = currentRow.nextElementSibling as HTMLTableRowElement | null;
                console.log('[TSV Paste] Looking for next row:', nextRow?.tagName, nextRow?.classList.toString());
                if (nextRow && !nextRow.classList.contains('add-row-footer')) {
                    currentRow = nextRow;
                    console.log('[TSV Paste] Moving to next existing row');
                } else {
                    currentRow = null;
                    console.log('[TSV Paste] No more existing rows, will create new ones');
                }
            }
        }
        console.log('[TSV Paste] Completed all rows');
    }
    
    /**
     * Apply TSV row data to a table row
     * @param row - The table row element
     * @param columnTypes - Array of column type strings
     * @param startColIndex - Starting column index
     * @param data - Array of cell values
     */
    private async applyTSVRowDataSequentially(row: HTMLTableRowElement, startCell: HTMLElement, data: string[]): Promise<void> {
        // Build column type map dynamically as we go
        const startCellElement = startCell.closest('td');
        if (!startCellElement) return;
        
        // Get all cells
        let allCells = Array.from(row.querySelectorAll('td'));
        let currentCellIndex = allCells.indexOf(startCellElement as HTMLTableCellElement);
        
        if (currentCellIndex === -1) return;
        
        // Apply each data value sequentially
        for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
            const value = data[dataIdx];
            
            // Find next visible cell from current position
            let targetCell: HTMLTableCellElement | null = null;
            for (let i = currentCellIndex; i < allCells.length; i++) {
                const cell = allCells[i] as HTMLTableCellElement;
                const computedStyle = window.getComputedStyle(cell);
                if (computedStyle.display !== 'none') {
                    targetCell = cell;
                    currentCellIndex = i + 1; // Move to next for next iteration
                    break;
                }
            }
            
            if (!targetCell) break; // No more visible cells
            
            // Get the input element in this cell
            const inputElement = targetCell.querySelector('input, [contenteditable="true"]') as HTMLInputElement | HTMLElement;
            if (!inputElement) continue;
            
            // Determine column type
            const colType = this.getCellColumnType(targetCell);
            
            // Set value
            if (colType === 'assignment') {
                inputElement.innerHTML = value;
            } else {
                (inputElement as HTMLInputElement).value = value;
            }
            
            // Dispatch input event to trigger validation and state update
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            
            // If this is multiplicity, wait for J columns to update
            if (colType === 'multiplicity') {
                // Wait for DOM updates to complete
                await new Promise<void>(resolve => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            resolve();
                        });
                    });
                });
                
                // Rebuild the cell list with updated visibility
                allCells = Array.from(row.querySelectorAll('td'));
                // Find current position in updated list
                currentCellIndex = allCells.indexOf(targetCell) + 1;
            }
        }
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
        addButton.tabIndex = -1; // Exclude from tab order
        addButton.addEventListener('click', () => {
            const newId = this.tableState.addRow();
            requestAnimationFrame(() => {
                const newRow = this.rowElements.get(newId);
                if (newRow) {
                    const firstInput = newRow.querySelector('.shift-input') as HTMLInputElement;
                    firstInput?.focus();
                }
            });
        }, { signal: this.abortController.signal });
        
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
        assignmentInput.className = 'assignment-input input-richtext';
        assignmentInput.setAttribute('contenteditable', 'true');
        assignmentInput.setAttribute('data-placeholder', 'e.g., H-8');
        assignmentInput.innerHTML = rowData.assignment;
        assignmentCell.appendChild(assignmentInput);
        this.setupAssignmentInput(assignmentInput, rowData.id, row);
        row.appendChild(assignmentCell);

        return row;
    }

    private setupShiftInput(input: HTMLInputElement, rowId: string, row: HTMLTableRowElement): void {
        // Handle paste event
        input.addEventListener('paste', (e) => {
            const clipboardData = (e as ClipboardEvent).clipboardData;
            const text = clipboardData?.getData('text/plain') || '';
            
            if (isTSVData(text)) {
                e.preventDefault();
                this.handleTSVPaste(input, row, text);
            }
            // Otherwise, allow default paste behavior
        }, { signal: this.abortController.signal });

        input.addEventListener('input', () => {
            this.tableState.updateRow(rowId, { shift: input.value });
            // Clear error on input (real-time clearing, no new errors shown)
            this.validationState.clearError(`shift-${rowId}`);
        }, { signal: this.abortController.signal });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling || row.nextElementSibling.classList.contains('add-row-footer');
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        requestAnimationFrame(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const targetInput = newRow.querySelector('.shift-input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        });
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
            }
        }, { signal: this.abortController.signal });
    }

    private setupMultiplicityInput(input: HTMLInputElement, rowId: string, row: HTMLTableRowElement): void {
        // Handle paste event
        input.addEventListener('paste', (e) => {
            const clipboardData = (e as ClipboardEvent).clipboardData;
            const text = clipboardData?.getData('text/plain') || '';
            
            if (isTSVData(text)) {
                e.preventDefault();
                this.handleTSVPaste(input, row, text);
            }
            // Otherwise, allow default paste behavior
        }, { signal: this.abortController.signal });

        input.addEventListener('input', () => {
            this.tableState.updateRow(rowId, { multiplicity: input.value });
            // Clear error on input (real-time clearing, no new errors shown)
            this.validationState.clearError(`mult-${rowId}`);

            // Recalculate J columns when multiplicity changes
            this.updateJColumnVisibility();
        }, { signal: this.abortController.signal });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling || row.nextElementSibling.classList.contains('add-row-footer');
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        requestAnimationFrame(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const targetInput = newRow.querySelector('.mult-input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        });
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
            }
        }, { signal: this.abortController.signal });
    }

    private setupJInput(input: HTMLInputElement, rowId: string, index: number, row: HTMLTableRowElement): void {
        // Handle paste event
        input.addEventListener('paste', (e) => {
            const clipboardData = (e as ClipboardEvent).clipboardData;
            const text = clipboardData?.getData('text/plain') || '';
            
            if (isTSVData(text)) {
                e.preventDefault();
                this.handleTSVPaste(input, row, text);
            }
            // Otherwise, allow default paste behavior
        }, { signal: this.abortController.signal });

        input.addEventListener('input', () => {
            // Use shared input filter
            const filtered = filterNumericInput(input.value);
            
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
            // Clear error on input (real-time clearing, no new errors shown)
            this.validationState.clearError(`j${index}-${rowId}`);
        }, { signal: this.abortController.signal });

        // J-value sorting removed - will be handled when Generate Text is clicked

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling || row.nextElementSibling.classList.contains('add-row-footer');
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        requestAnimationFrame(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const cellIndex = Array.from(row.children).indexOf(input.closest('td')!);
                                const targetCell = newRow.children[cellIndex] as HTMLTableCellElement;
                                const targetInput = targetCell?.querySelector('input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        });
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
            }
        }, { signal: this.abortController.signal });
    }

    private setupIntegrationInput(input: HTMLInputElement, rowId: string, row: HTMLTableRowElement): void {
        // Handle paste event
        input.addEventListener('paste', (e) => {
            const clipboardData = (e as ClipboardEvent).clipboardData;
            const text = clipboardData?.getData('text/plain') || '';
            
            if (isTSVData(text)) {
                e.preventDefault();
                this.handleTSVPaste(input, row, text);
            }
            // Otherwise, allow default paste behavior
        }, { signal: this.abortController.signal });

        input.addEventListener('input', () => {
            // Use shared input filter
            const filtered = filterNumericInput(input.value);
            
            if (filtered !== input.value) {
                input.value = filtered;
            }

            const value = parseFloat(input.value);
            this.tableState.updateRow(rowId, { integration: isNaN(value) ? 0 : value });
            // Clear error on input (real-time clearing, no new errors shown)
            this.validationState.clearError(`int-${rowId}`);
        }, { signal: this.abortController.signal });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusNextTableCell(input, row, e.shiftKey);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling || row.nextElementSibling.classList.contains('add-row-footer');
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        requestAnimationFrame(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const targetInput = newRow.querySelector('.int-input') as HTMLInputElement;
                                targetInput?.focus();
                            }
                        });
                        return;
                    }
                }

                this.keyboardNav.handleCellNavigation(e, input, row, (direction) => {
                    this.keyboardNav.navigateToCell(row, input, direction);
                });
            }
        }, { signal: this.abortController.signal });
    }

    private setupAssignmentInput(input: HTMLElement, rowId: string, row: HTMLTableRowElement): void {
        // Paste filtering
        input.addEventListener('paste', (e) => {
            const clipboardData = (e as ClipboardEvent).clipboardData;
            const text = clipboardData?.getData('text/plain') || '';
            
            // Check if TSV data
            if (isTSVData(text)) {
                e.preventDefault();
                this.handleTSVPaste(input, row, text);
                return;
            }
            
            // Otherwise, handle as rich text paste (existing behavior)
            e.preventDefault();
            const htmlText = clipboardData?.getData('text/html') || clipboardData?.getData('text/plain') || '';
            const temp = document.createElement('div');
            temp.innerHTML = htmlText;
            const filtered = filterHTMLTags(temp, ['B', 'I', 'SUB', 'SUP']);
            document.execCommand('insertHTML', false, filtered);
        }, { signal: this.abortController.signal });

        input.addEventListener('input', () => {
            const html = input.innerHTML.trim() === '' || input.innerHTML === '<br>' ? '' : input.innerHTML;
            this.tableState.updateRow(rowId, { assignment: html });
            // Clear error on input (real-time clearing, no new errors shown)
            this.validationState.clearError(`assignment-${rowId}`);
        }, { signal: this.abortController.signal });

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
                    if (nextRow && !nextRow.classList.contains('add-row-footer')) {
                        const nextAssignment = nextRow.querySelector('.assignment-input') as HTMLElement;
                        nextAssignment?.focus();
                    } else {
                        // Last row: add new row
                        const newId = this.tableState.addRow();
                        requestAnimationFrame(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const newAssignment = newRow.querySelector('.assignment-input') as HTMLElement;
                                newAssignment?.focus();
                            }
                        });
                    }
                }
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if ArrowDown at last row
                if (e.key === 'ArrowDown') {
                    const isLastRow = !row.nextElementSibling || row.nextElementSibling.classList.contains('add-row-footer');
                    if (isLastRow) {
                        e.preventDefault();
                        const newId = this.tableState.addRow();
                        requestAnimationFrame(() => {
                            const newRow = this.rowElements.get(newId);
                            if (newRow) {
                                const nextAssignment = newRow.querySelector('.assignment-input') as HTMLElement;
                                nextAssignment?.focus();
                            }
                        });
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
                            if (nextRow && !nextRow.classList.contains('add-row-footer')) {
                                const nextShift = nextRow.querySelector('.shift-input') as HTMLInputElement;
                                nextShift?.focus();
                            } else {
                                // Last row: add new row
                                const newId = this.tableState.addRow();
                                requestAnimationFrame(() => {
                                    const newRow = this.rowElements.get(newId);
                                    if (newRow) {
                                        const firstInput = newRow.querySelector('.shift-input') as HTMLInputElement;
                                        firstInput?.focus();
                                    }
                                });
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
        }, { signal: this.abortController.signal });

        // Ensure placeholder shows when field is empty on blur
        input.addEventListener('blur', () => {
            const text = input.textContent?.trim() || '';
            if (text === '') {
                input.innerHTML = '';
            }
        }, { signal: this.abortController.signal });
    }

    private setupDeleteButton(button: HTMLButtonElement, rowId: string): void {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.tableState.removeRows([rowId]);
        }, { signal: this.abortController.signal });
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
            requestAnimationFrame(() => {
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
            });
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
        
        // Re-render footer to update colspan based on new maxJColumns
        this.renderAddRowFooter();
    }

    private calculateRequiredJColumns(multiplicity: string): number {
        if (!multiplicity || multiplicity.trim() === '') {
            return 0;
        }

        try {
            // 直接 multipletnumbers() を呼び出す（変換不要）
            const jCounts = (window as any).multipletnumbers(multiplicity.trim());
            if (jCounts === null) {
                return 0;
            }
            return jCounts.length;
        } catch {
            return 0;
        }
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

    

    getFirstInput(): HTMLElement | null {
        const firstRow = this.tableBody.querySelector('tr');
        if (firstRow) {
            return firstRow.querySelector('.shift-input');
        }
        return null;
    }

    /**
     * Clean up event listeners and resources
     * Should be called when the component is destroyed
     */
    public destroy(): void {
        // Abort all event listeners attached with AbortController
        this.abortController.abort();
        
        // Clear row elements map
        this.rowElements.clear();
        
        // Create new AbortController for potential reuse
        this.abortController = new AbortController();
    }
}
