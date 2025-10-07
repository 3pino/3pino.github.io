/**
 * Metadata Form Component
 * Handles nuclei, solvent, frequency, precision, and sort order inputs
 */

import { MetadataState } from '../../state/MetadataState';
import { ValidationState } from '../../state/ValidationState';

export class MetadataForm {
    private metadataState: MetadataState;
    private validationState: ValidationState;
    private elements: {
        nuclei: HTMLElement;
        solvent: HTMLElement;
        frequency: HTMLElement;
        shiftPrecision: HTMLElement;
        jPrecision: HTMLElement;
        sortOrder: HTMLSelectElement;
    };
    private dropdowns: {
        nuclei: HTMLElement;
        solvent: HTMLElement;
    };

    constructor(
        metadataState: MetadataState,
        validationState: ValidationState,
        onNavigateNext: (currentField: HTMLElement, reverse: boolean) => void
    ) {
        this.metadataState = metadataState;
        this.validationState = validationState;

        this.elements = {
            nuclei: document.getElementById('nuclei')!,
            solvent: document.getElementById('solvent')!,
            frequency: document.getElementById('frequency')!,
            shiftPrecision: document.getElementById('shift-precision')!,
            jPrecision: document.getElementById('j-precision')!,
            sortOrder: document.getElementById('sort-order') as HTMLSelectElement
        };

        this.dropdowns = {
            nuclei: document.getElementById('nuclei-dropdown')!,
            solvent: document.getElementById('solvent-dropdown')!
        };

        this.initializeValues();
        this.initializeEventListeners(onNavigateNext);
        this.initializeDropdowns();
    }

    private initializeValues(): void {
        const data = this.metadataState.getData();
        this.elements.nuclei.innerHTML = data.nuclei;
        this.elements.solvent.innerHTML = data.solvent;
        this.elements.frequency.textContent = isNaN(data.frequency) ? '' : data.frequency.toString();
        this.elements.shiftPrecision.textContent = data.shiftPrecision.toString();
        this.elements.jPrecision.textContent = data.jPrecision.toString();
        this.elements.sortOrder.value = data.sortOrder;
    }

    private initializeEventListeners(onNavigateNext: (currentField: HTMLElement, reverse: boolean) => void): void {
        // Nuclei input
        this.setupContentEditableField(this.elements.nuclei, (value) => {
            this.metadataState.setNuclei(value);
        }, onNavigateNext);

        // Solvent input
        this.setupContentEditableField(this.elements.solvent, (value) => {
            this.metadataState.setSolvent(value);
        }, onNavigateNext);

        // Number fields
        this.setupNumberField(this.elements.frequency, (value) => {
            this.metadataState.setFrequency(value);
        }, null, null, onNavigateNext);

        this.setupNumberField(this.elements.shiftPrecision, (value) => {
            this.metadataState.setShiftPrecision(value);
        }, 1, 10, onNavigateNext);

        this.setupNumberField(this.elements.jPrecision, (value) => {
            this.metadataState.setJPrecision(value);
        }, 1, 10, onNavigateNext);

        // Sort order
        this.elements.sortOrder.addEventListener('change', () => {
            this.metadataState.setSortOrder(this.elements.sortOrder.value as 'asc' | 'desc');
        });

        // Validation error display
        this.validationState.onChange((errors) => {
            Object.values(this.elements).forEach(el => {
                if (el instanceof HTMLElement) {
                    const fieldId = el.id;
                    if (errors.has(fieldId)) {
                        el.classList.add('error');
                    } else {
                        el.classList.remove('error');
                    }
                }
            });
        });
    }

    private setupContentEditableField(
        element: HTMLElement,
        onChange: (value: string) => void,
        onNavigateNext: (currentField: HTMLElement, reverse: boolean) => void
    ): void {
        // Paste filtering (only allow B, I, SUB, SUP tags)
        element.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/html') || e.clipboardData?.getData('text/plain') || '';
            const temp = document.createElement('div');
            temp.innerHTML = text;
            const filtered = this.filterHTMLTags(temp, ['B', 'I', 'SUB', 'SUP']);
            document.execCommand('insertHTML', false, filtered);
        });

        // Input handling
        element.addEventListener('input', () => {
            onChange(element.innerHTML);
            this.validationState.clearError(element.id);
        });

        // Enter key navigation
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onNavigateNext(element, e.shiftKey);
                return;
            }

            // Keyboard shortcuts (Ctrl+B, Ctrl+I)
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
        element.addEventListener('blur', () => {
            const html = element.innerHTML.trim();
            if (html === '' || html === '<br>') {
                element.innerHTML = '';
            }
        });
    }

    private setupNumberField(
        element: HTMLElement,
        onChange: (value: number) => void,
        min: number | null,
        max: number | null,
        onNavigateNext: (currentField: HTMLElement, reverse: boolean) => void
    ): void {
        // Enter key navigation
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onNavigateNext(element, e.shiftKey);
            }
        });

        // Input validation
        element.addEventListener('input', () => {
            const text = element.textContent || '';
            const cleanText = text.replace(/[^0-9]/g, '');

            if (text !== cleanText) {
                element.textContent = cleanText;
                this.moveCursorToEnd(element);
            }

            if (cleanText !== '') {
                const num = parseInt(cleanText);
                onChange(num);

                if ((min !== null && num < min) || (max !== null && num > max)) {
                    element.classList.add('error');
                } else {
                    element.classList.remove('error');
                }
            } else {
                element.classList.remove('error');
            }
        });

        // Paste filtering
        element.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') || '';
            const cleanText = text.replace(/[^0-9]/g, '');
            document.execCommand('insertText', false, cleanText);
        });

        // Clear error on focus
        element.addEventListener('focus', () => {
            this.validationState.clearError(element.id);
        });

        // Ensure placeholder shows when field is empty on blur
        element.addEventListener('blur', () => {
            const text = element.textContent || '';
            if (text.trim() === '') {
                element.textContent = '';
            }
        });
    }

    private initializeDropdowns(): void {
        this.setupDropdown('nuclei', (window as any).NUCLEI_PRESETS || []);
        this.setupDropdown('solvent', (window as any).SOLVENT_PRESETS || []);
    }

    private setupDropdown(field: 'nuclei' | 'solvent', presets: any[]): void {
        const input = this.elements[field];
        const dropdown = this.dropdowns[field];

        if (!input || !dropdown) return;

        // Populate dropdown
        dropdown.innerHTML = '';
        presets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.setAttribute('data-value', preset.displayHTML);
            item.innerHTML = preset.displayHTML;
            dropdown.appendChild(item);
        });

        // Show/hide dropdown
        input.addEventListener('focus', () => {
            dropdown.classList.add('active');
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.classList.remove('active');
            }, 200);
        });

        // Handle selection
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const value = item.getAttribute('data-value') || '';
                input.innerHTML = value;
                if (field === 'nuclei') {
                    this.metadataState.setNuclei(value);
                } else {
                    this.metadataState.setSolvent(value);
                }
                dropdown.classList.remove('active');
            });
        });
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

    private moveCursorToEnd(element: HTMLElement): void {
        const range = document.createRange();
        const sel = window.getSelection();
        if (element.childNodes.length > 0) {
            const textNode = element.childNodes[0];
            const length = textNode.textContent?.length || 0;
            range.setStart(textNode, length);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }

    getFieldOrder(): HTMLElement[] {
        return [
            this.elements.nuclei,
            this.elements.solvent,
            this.elements.frequency,
            this.elements.shiftPrecision,
            this.elements.jPrecision,
            this.elements.sortOrder
        ];
    }
}
