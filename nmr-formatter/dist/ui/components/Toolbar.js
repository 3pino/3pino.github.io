"use strict";
/**
 * Formatting Toolbar Component
 * Handles bold, italic, subscript, superscript, and en-dash formatting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = void 0;
class Toolbar {
    constructor() {
        // AbortController for cleaning up event listeners
        this.abortController = new AbortController();
        this.buttons = {
            bold: document.getElementById('format-bold-btn'),
            italic: document.getElementById('format-italic-btn'),
            sub: document.getElementById('format-sub-btn'),
            sup: document.getElementById('format-sup-btn'),
            endash: document.getElementById('insert-endash-btn')
        };
        this.initializeEventListeners();
        this.initializeFocusTracking();
    }
    initializeEventListeners() {
        // Use mousedown to prevent blur on contenteditable fields
        this.buttons.bold.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('bold');
        }, { signal: this.abortController.signal });
        this.buttons.italic.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('italic');
        }, { signal: this.abortController.signal });
        this.buttons.sub.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('subscript');
        }, { signal: this.abortController.signal });
        this.buttons.sup.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('superscript');
        }, { signal: this.abortController.signal });
        this.buttons.endash.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.insertEnDash();
        }, { signal: this.abortController.signal });
    }
    initializeFocusTracking() {
        // Track focus changes to update button states
        document.addEventListener('focusin', () => {
            this.updateButtonStates();
        }, { signal: this.abortController.signal });
        document.addEventListener('focusout', () => {
            this.updateButtonStates();
        }, { signal: this.abortController.signal });
        // Initial state
        this.updateButtonStates();
    }
    updateButtonStates() {
        const activeElement = document.activeElement;
        const isRichTextFocused = activeElement === null || activeElement === void 0 ? void 0 : activeElement.classList.contains('input-richtext');
        // Enable/disable buttons based on focus
        Object.values(this.buttons).forEach(button => {
            if (isRichTextFocused) {
                button.classList.remove('disabled');
            }
            else {
                button.classList.add('disabled');
            }
        });
    }
    applyFormatting(command) {
        const activeElement = document.activeElement;
        if (!activeElement || activeElement.getAttribute('contenteditable') !== 'true') {
            return;
        }
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            document.execCommand(command, false);
            activeElement.focus();
        }
    }
    insertEnDash() {
        const activeElement = document.activeElement;
        if (!activeElement || activeElement.getAttribute('contenteditable') !== 'true') {
            return;
        }
        document.execCommand('insertHTML', false, '–');
        activeElement.focus();
    }
    /**
     * Clean up event listeners and resources
     * Should be called when the component is destroyed
     */
    destroy() {
        // Abort all event listeners attached with AbortController
        this.abortController.abort();
        // Create new AbortController for potential reuse
        this.abortController = new AbortController();
    }
}
exports.Toolbar = Toolbar;
//# sourceMappingURL=Toolbar.js.map