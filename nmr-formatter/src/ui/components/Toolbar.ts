/**
 * Formatting Toolbar Component
 * Handles bold, italic, subscript, superscript, and en-dash formatting
 */

export class Toolbar {
    private buttons: {
        bold: HTMLElement;
        italic: HTMLElement;
        sub: HTMLElement;
        sup: HTMLElement;
        endash: HTMLElement;
    };

    constructor() {
        this.buttons = {
            bold: document.getElementById('format-bold-btn')!,
            italic: document.getElementById('format-italic-btn')!,
            sub: document.getElementById('format-sub-btn')!,
            sup: document.getElementById('format-sup-btn')!,
            endash: document.getElementById('insert-endash-btn')!
        };

        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Use mousedown to prevent blur on contenteditable fields
        this.buttons.bold.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('bold');
        });

        this.buttons.italic.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('italic');
        });

        this.buttons.sub.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('subscript');
        });

        this.buttons.sup.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('superscript');
        });

        this.buttons.endash.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.insertEnDash();
        });
    }

    private applyFormatting(command: string): void {
        const activeElement = document.activeElement;

        if (!activeElement || activeElement.getAttribute('contenteditable') !== 'true') {
            return;
        }

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            document.execCommand(command, false);
            (activeElement as HTMLElement).focus();
        }
    }

    private insertEnDash(): void {
        const activeElement = document.activeElement;

        if (!activeElement || activeElement.getAttribute('contenteditable') !== 'true') {
            return;
        }

        document.execCommand('insertHTML', false, '–');
        (activeElement as HTMLElement).focus();
    }
}
