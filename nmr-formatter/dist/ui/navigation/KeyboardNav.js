"use strict";
/**
 * Keyboard Navigation
 * Handles arrow key navigation within table cells and other complex navigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardNav = void 0;
class KeyboardNav {
    /**
     * Handle arrow key navigation between table cells
     */
    handleCellNavigation(e, currentInput, currentRow, onNavigate) {
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
            }
            else if (currentInput.type === 'number') {
                this.handleNumberInputArrowKeys(e, onNavigate);
            }
            else {
                this.handleTextInputArrowKeys(e, currentInput, onNavigate);
            }
        }
    }
    handleContentEditableArrowKeys(e, currentInput, onNavigate) {
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const text = currentInput.textContent || '';
        const cursorPosition = range ? range.startOffset : 0;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onNavigate('up');
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNavigate('down');
        }
        else if (e.key === 'ArrowRight' && cursorPosition >= text.length) {
            e.preventDefault();
            onNavigate('right');
        }
        else if (e.key === 'ArrowLeft' && cursorPosition === 0) {
            e.preventDefault();
            onNavigate('left');
        }
    }
    handleNumberInputArrowKeys(e, onNavigate) {
        // For number inputs, always override arrow keys for navigation
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onNavigate('up');
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNavigate('down');
        }
        else if (e.key === 'ArrowRight') {
            e.preventDefault();
            onNavigate('right');
        }
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onNavigate('left');
        }
    }
    handleTextInputArrowKeys(e, currentInput, onNavigate) {
        const cursorPosition = currentInput.selectionStart || 0;
        const text = currentInput.value || '';
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onNavigate('up');
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNavigate('down');
        }
        else if (e.key === 'ArrowRight' && cursorPosition >= text.length) {
            e.preventDefault();
            onNavigate('right');
        }
        else if (e.key === 'ArrowLeft' && cursorPosition === 0) {
            e.preventDefault();
            onNavigate('left');
        }
    }
    /**
     * Navigate to adjacent cell in table
     */
    navigateToCell(currentRow, currentInput, direction, onBeforeNavigateUp) {
        const currentCell = currentInput.closest('td');
        if (!currentCell)
            return;
        if (direction === 'up' || direction === 'down') {
            this.navigateVertical(currentRow, currentCell, direction, onBeforeNavigateUp);
        }
        else {
            this.navigateHorizontal(currentRow, currentCell, direction, onBeforeNavigateUp);
        }
    }
    navigateVertical(currentRow, currentCell, direction, onBeforeNavigateUp) {
        const targetRow = direction === 'up'
            ? currentRow.previousElementSibling
            : currentRow.nextElementSibling;
        if (!targetRow)
            return;
        // If navigating up and callback is provided, call it before navigation
        if (direction === 'up' && onBeforeNavigateUp) {
            const currentRowId = currentRow.dataset.rowId;
            if (currentRowId) {
                onBeforeNavigateUp(currentRowId);
            }
        }
        const cellIndex = Array.from(currentRow.children).indexOf(currentCell);
        const targetCell = targetRow.children[cellIndex];
        if (targetCell) {
            const targetInput = targetCell.querySelector('input, [contenteditable="true"]');
            targetInput === null || targetInput === void 0 ? void 0 : targetInput.focus();
        }
    }
    navigateHorizontal(currentRow, currentCell, direction, onBeforeNavigateUp) {
        var _a;
        // Find all visible, enabled cells
        const allCells = Array.from(currentRow.querySelectorAll('td:not(.checkbox-cell)'));
        const visibleCells = allCells.filter(cell => {
            if (cell.style.display === 'none')
                return false;
            const input = cell.querySelector('input, [contenteditable="true"]');
            if (!input)
                return false;
            if (input.disabled)
                return false;
            return true;
        });
        const currentIndex = visibleCells.indexOf(currentCell);
        if (currentIndex === -1)
            return;
        const targetIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
        // Handle wrap to previous row when at leftmost cell
        if (direction === 'left' && targetIndex < 0) {
            const currentInput = currentCell.querySelector('input, [contenteditable="true"]');
            const cursorAtStart = this.isCursorAtStart(currentInput);
            if (cursorAtStart) {
                // Get previous row BEFORE calling callback (currentRow might be deleted)
                const prevRow = currentRow.previousElementSibling;
                // If navigating up and callback is provided, call it before navigation
                if (onBeforeNavigateUp) {
                    const currentRowId = currentRow.dataset.rowId;
                    if (currentRowId) {
                        onBeforeNavigateUp(currentRowId);
                    }
                }
                // Navigate to previous row's rightmost cell
                if (prevRow) {
                    const prevCells = Array.from(prevRow.querySelectorAll('td:not(.checkbox-cell)'));
                    const prevVisibleCells = prevCells.filter(cell => {
                        if (cell.style.display === 'none')
                            return false;
                        const input = cell.querySelector('input, [contenteditable="true"]');
                        if (!input)
                            return false;
                        if (input.disabled)
                            return false;
                        return true;
                    });
                    if (prevVisibleCells.length > 0) {
                        const lastCell = prevVisibleCells[prevVisibleCells.length - 1];
                        const targetInput = lastCell.querySelector('input:not([disabled]), [contenteditable="true"]');
                        if (targetInput) {
                            targetInput.focus();
                            // Set cursor to end
                            this.setCursorToEnd(targetInput);
                        }
                    }
                }
            }
            return;
        }
        if (targetIndex < 0 || targetIndex >= visibleCells.length)
            return;
        const targetCell = visibleCells[targetIndex];
        const targetInput = targetCell.querySelector('input:not([disabled]), [contenteditable="true"]');
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
                    }
                    else {
                        range.setStart(textNode, ((_a = textNode.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0);
                    }
                    range.collapse(true);
                    sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
                    sel === null || sel === void 0 ? void 0 : sel.addRange(range);
                }
            }
            else if (targetInput.type !== 'number') {
                // Set cursor position for text inputs
                const input = targetInput;
                if (direction === 'right') {
                    input.setSelectionRange(0, 0);
                }
                else {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }
            }
        }
    }
    /**
     * Check if cursor is at the start of the input
     */
    isCursorAtStart(input) {
        if (input.getAttribute('contenteditable') === 'true') {
            const selection = window.getSelection();
            const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            return range ? range.startOffset === 0 : false;
        }
        else if (input.type === 'number') {
            // Number inputs don't support selection, so always return false
            return false;
        }
        else {
            const textInput = input;
            return (textInput.selectionStart || 0) === 0;
        }
    }
    /**
     * Set cursor to the end of the input
     */
    setCursorToEnd(input) {
        var _a;
        if (input.getAttribute('contenteditable') === 'true') {
            const range = document.createRange();
            const sel = window.getSelection();
            const textNode = input.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                const length = ((_a = textNode.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0;
                range.setStart(textNode, length);
                range.collapse(true);
                sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
                sel === null || sel === void 0 ? void 0 : sel.addRange(range);
            }
        }
        else if (input.type !== 'number') {
            const textInput = input;
            const len = textInput.value.length;
            textInput.setSelectionRange(len, len);
        }
    }
}
exports.KeyboardNav = KeyboardNav;
//# sourceMappingURL=KeyboardNav.js.map