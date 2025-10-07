/**
 * Rich Text Editor Component
 * Displays formatted NMR text output
 */

export class RichTextEditor {
    private element: HTMLElement;

    constructor() {
        this.element = document.getElementById('rich-text-editor')!;
    }

    setContent(html: string): void {
        this.element.innerHTML = html;
    }

    getContent(): string {
        return this.element.innerHTML;
    }

    clear(): void {
        this.element.innerHTML = '';
    }

    showPlaceholder(message: string = 'No valid peaks to display. Add peak data in the table above.'): void {
        this.element.innerHTML = `<span style="color: #999;">${message}</span>`;
    }

    showError(message: string): void {
        this.element.innerHTML = `<span style="color: red;">Error: ${message}</span>`;
    }
}
