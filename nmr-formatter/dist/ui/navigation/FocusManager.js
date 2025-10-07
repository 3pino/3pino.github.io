"use strict";
/**
 * Focus Manager
 * Manages focus order and navigation between form fields
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FocusManager = void 0;
class FocusManager {
    constructor(metadataFields, onExitMetadataToTable) {
        this.metadataFields = [];
        this.metadataFields = metadataFields;
        this.onExitMetadataToTable = onExitMetadataToTable;
    }
    /**
     * Focus next metadata field (Tab navigation)
     */
    focusNextMetadataField(currentField, reverse = false) {
        const currentIndex = this.metadataFields.indexOf(currentField);
        if (currentIndex === -1)
            return;
        let targetIndex;
        if (reverse) {
            // Shift+Tab: go to previous field, or wrap to last field
            targetIndex = currentIndex > 0 ? currentIndex - 1 : this.metadataFields.length - 1;
        }
        else {
            // Tab: go to next field, or jump to table
            if (currentIndex < this.metadataFields.length - 1) {
                targetIndex = currentIndex + 1;
            }
            else {
                // Last metadata field: jump to table
                if (this.onExitMetadataToTable) {
                    this.onExitMetadataToTable();
                }
                return;
            }
        }
        const targetField = this.metadataFields[targetIndex];
        if (targetField) {
            targetField.focus();
        }
    }
    /**
     * Move cursor to end of contenteditable element
     */
    moveCursorToEnd(element) {
        var _a;
        const range = document.createRange();
        const sel = window.getSelection();
        if (element.childNodes.length > 0) {
            const lastNode = element.childNodes[element.childNodes.length - 1];
            if (lastNode.nodeType === Node.TEXT_NODE) {
                range.setStart(lastNode, ((_a = lastNode.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0);
            }
            else {
                range.setStartAfter(lastNode);
            }
            range.collapse(true);
            sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
            sel === null || sel === void 0 ? void 0 : sel.addRange(range);
        }
    }
    /**
     * Move cursor to start of contenteditable element
     */
    moveCursorToStart(element) {
        const range = document.createRange();
        const sel = window.getSelection();
        if (element.childNodes.length > 0) {
            range.setStart(element.childNodes[0], 0);
            range.collapse(true);
            sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
            sel === null || sel === void 0 ? void 0 : sel.addRange(range);
        }
    }
}
exports.FocusManager = FocusManager;
//# sourceMappingURL=FocusManager.js.map