"use strict";
/**
 * Rich Text Editor Component
 * Displays formatted NMR text output
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RichTextEditor = void 0;
class RichTextEditor {
    constructor() {
        this.element = document.getElementById('rich-text-editor');
    }
    setContent(html) {
        this.element.innerHTML = html;
    }
    getContent() {
        return this.element.innerHTML;
    }
    clear() {
        this.element.innerHTML = '';
    }
    showPlaceholder(message = 'No valid peaks to display. Add peak data in the table above.') {
        this.element.innerHTML = `<span style="color: #999;">${message}</span>`;
    }
    showError(message) {
        this.element.innerHTML = `<span style="color: red;">Error: ${message}</span>`;
    }
}
exports.RichTextEditor = RichTextEditor;
//# sourceMappingURL=RichTextEditor.js.map