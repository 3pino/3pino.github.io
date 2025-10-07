/**
 * Keyboard Navigation
 * Handles arrow key navigation within table cells and other complex navigation
 */

export class KeyboardNav {
    /**
     * Handle arrow key navigation between table cells
     */
    handleCellNavigation(
        e: KeyboardEvent,
        currentInput: HTMLElement,
        currentRow: HTMLTableRowElement,
        onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void
    ): void {
        const key = e.key;

        // Handle Tab navigation (handled by browser default + custom logic)
        if (key === 'Tab') {
            return; // Let default or custom Tab handlers manage this
        }

        // Arrow key navigation
        if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            const isContentEditable = currentInput.getAttribute('contenteditable') === 'true';

            if (isContentEditable) {
                this.handleContentEditableArrowKeys(e, currentInput, onNavigate);
            } else if ((currentInput as HTMLInputElement).type === 'number') {
                this.handleNumberInputArrowKeys(e, onNavigate);
            } else {
                this.handleTextInputArrowKeys(e, currentInput as HTMLInputElement, onNavigate);
            }
        }
    }

    private handleContentEditableArrowKeys(
        e: KeyboardEvent,
        currentInput: HTMLElement,
        onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void
    ): void {
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const text = currentInput.textContent || '';
        const cursorPosition = range ? range.startOffset : 0;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onNavigate('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNavigate('down');
        } else if (e.key === 'ArrowRight' && cursorPosition >= text.length) {
            e.preventDefault();
            onNavigate('right');
        } else if (e.key === 'ArrowLeft' && cursorPosition === 0) {
            e.preventDefault();
            onNavigate('left');
        }
    }

    private handleNumberInputArrowKeys(
        e: KeyboardEvent,
        onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void
    ): void {
        // For number inputs, always override arrow keys for navigation
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onNavigate('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNavigate('down');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            onNavigate('right');
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onNavigate('left');
        }
    }

    private handleTextInputArrowKeys(
        e: KeyboardEvent,
        currentInput: HTMLInputElement,
        onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void
    ): void {
        const cursorPosition = currentInput.selectionStart || 0;
        const text = currentInput.value || '';

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onNavigate('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNavigate('down');
        } else if (e.key === 'ArrowRight' && cursorPosition >= text.length) {
            e.preventDefault();
            onNavigate('right');
        } else if (e.key === 'ArrowLeft' && cursorPosition === 0) {
            e.preventDefault();
            onNavigate('left');
        }
    }

    /**
     * Navigate to adjacent cell in table
     */
    navigateToCell(
        currentRow: HTMLTableRowElement,
        currentInput: HTMLElement,
        direction: 'up' | 'down' | 'left' | 'right'
    ): void {
        const currentCell = currentInput.closest('td');
        if (!currentCell) return;

        if (direction === 'up' || direction === 'down') {
            this.navigateVertical(currentRow, currentCell, direction);
        } else {
            this.navigateHorizontal(currentRow, currentCell, direction);
        }
    }

    private navigateVertical(
        currentRow: HTMLTableRowElement,
        currentCell: HTMLTableCellElement,
        direction: 'up' | 'down'
    ): void {
        const targetRow = direction === 'up'
            ? currentRow.previousElementSibling as HTMLTableRowElement
            : currentRow.nextElementSibling as HTMLTableRowElement;

        if (!targetRow) return;

        const cellIndex = Array.from(currentRow.children).indexOf(currentCell);
        const targetCell = targetRow.children[cellIndex] as HTMLTableCellElement;

        if (targetCell) {
            const targetInput = targetCell.querySelector('input, [contenteditable="true"]') as HTMLElement;
            targetInput?.focus();
        }
    }

    private navigateHorizontal(
        currentRow: HTMLTableRowElement,
        currentCell: HTMLTableCellElement,
        direction: 'left' | 'right'
    ): void {
        // Find all visible, enabled cells
        const allCells = Array.from(currentRow.querySelectorAll('td:not(.checkbox-cell)')) as HTMLTableCellElement[];

        const visibleCells = allCells.filter(cell => {
            if (cell.style.display === 'none') return false;
            const input = cell.querySelector('input, [contenteditable="true"]') as HTMLInputElement | HTMLElement;
            if (!input) return false;
            if ((input as HTMLInputElement).disabled) return false;
            return true;
        });

        const currentIndex = visibleCells.indexOf(currentCell);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
        if (targetIndex < 0 || targetIndex >= visibleCells.length) return;

        const targetCell = visibleCells[targetIndex];
        const targetInput = targetCell.querySelector('input:not([disabled]), [contenteditable="true"]') as HTMLElement;

        if (targetInput) {
            targetInput.focus();

            // Set cursor position for contenteditable
            if (targetInput.getAttribute('contenteditable') === 'true') {
                const range = document.createRange();
                const sel = window.getSelection();
                const textNode = targetInput.firstChild;

                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    if (direction === 'right') {
                        range.setStart(textNode, 0);
                    } else {
                        range.setStart(textNode, textNode.textContent?.length || 0);
                    }
                    range.collapse(true);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }
            } else if ((targetInput as HTMLInputElement).type !== 'number') {
                // Set cursor position for text inputs
                const input = targetInput as HTMLInputElement;
                if (direction === 'right') {
                    input.setSelectionRange(0, 0);
                } else {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }
            }
        }
    }
}
