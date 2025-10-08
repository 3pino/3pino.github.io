"use strict";
/**
 * Metadata Form Component
 * Handles nuclei, solvent, frequency, precision, and sort order inputs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataForm = void 0;
class MetadataForm {
    constructor(metadataState, validationState, onNavigateNext) {
        this.metadataState = metadataState;
        this.validationState = validationState;
        this.elements = {
            nuclei: document.getElementById('nuclei'),
            solvent: document.getElementById('solvent'),
            frequency: document.getElementById('frequency'),
            shiftPrecision: document.getElementById('shift-precision'),
            jPrecision: document.getElementById('j-precision'),
            sortOrder: document.getElementById('sort-order')
        };
        this.dropdowns = {
            nuclei: document.getElementById('nuclei-dropdown'),
            solvent: document.getElementById('solvent-dropdown')
        };
        this.initializeValues();
        this.initializeEventListeners(onNavigateNext);
        this.initializeDropdowns();
    }
    initializeValues() {
        const data = this.metadataState.getData();
        this.elements.nuclei.innerHTML = data.nuclei;
        this.elements.solvent.innerHTML = data.solvent;
        this.elements.frequency.textContent = isNaN(data.frequency) ? '' : data.frequency.toString();
        this.elements.shiftPrecision.textContent = data.shiftPrecision.toString();
        this.elements.jPrecision.textContent = data.jPrecision.toString();
        this.elements.sortOrder.value = data.sortOrder;
    }
    initializeEventListeners(onNavigateNext) {
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
            this.metadataState.setSortOrder(this.elements.sortOrder.value);
        });
        // Validation error display
        this.validationState.onChange((errors) => {
            Object.values(this.elements).forEach(el => {
                if (el instanceof HTMLElement) {
                    const fieldId = el.id;
                    if (errors.has(fieldId)) {
                        el.classList.add('error');
                    }
                    else {
                        el.classList.remove('error');
                    }
                }
            });
        });
    }
    setupContentEditableField(element, onChange, onNavigateNext) {
        // Paste filtering (only allow B, I, SUB, SUP tags)
        element.addEventListener('paste', (e) => {
            var _a, _b;
            e.preventDefault();
            const text = ((_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text/html')) || ((_b = e.clipboardData) === null || _b === void 0 ? void 0 : _b.getData('text/plain')) || '';
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
                }
                else if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    document.execCommand('italic');
                }
            }
        });
        // Ensure placeholder shows when field is empty on blur
        element.addEventListener('blur', () => {
            const cleaned = this.cleanupEmptyTags(element.innerHTML);
            if (cleaned === '' || cleaned === '<br>') {
                element.innerHTML = '';
            }
            else if (cleaned !== element.innerHTML) {
                element.innerHTML = cleaned;
            }
        });
    }
    setupNumberField(element, onChange, min, max, onNavigateNext) {
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
                }
                else {
                    element.classList.remove('error');
                }
            }
            else {
                element.classList.remove('error');
            }
        });
        // Paste filtering
        element.addEventListener('paste', (e) => {
            var _a;
            e.preventDefault();
            const text = ((_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text/plain')) || '';
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
    initializeDropdowns() {
        this.setupDropdown('nuclei', window.NUCLEI_PRESETS || []);
        this.setupDropdown('solvent', window.SOLVENT_PRESETS || []);
    }
    setupDropdown(field, presets) {
        const input = this.elements[field];
        const dropdown = this.dropdowns[field];
        if (!input || !dropdown)
            return;
        // Prevent dropdown from receiving focus
        dropdown.setAttribute('tabindex', '-1');
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
                }
                else {
                    this.metadataState.setSolvent(value);
                }
                dropdown.classList.remove('active');
            });
        });
    }
    filterHTMLTags(element, allowedTags) {
        let result = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent;
            }
            else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toUpperCase();
                if (allowedTags.includes(tagName)) {
                    result += `<${tagName.toLowerCase()}>${this.filterHTMLTags(node, allowedTags)}</${tagName.toLowerCase()}>`;
                }
                else {
                    result += this.filterHTMLTags(node, allowedTags);
                }
            }
        });
        return result;
    }
    moveCursorToEnd(element) {
        var _a;
        const range = document.createRange();
        const sel = window.getSelection();
        if (element.childNodes.length > 0) {
            const textNode = element.childNodes[0];
            const length = ((_a = textNode.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0;
            range.setStart(textNode, length);
            range.collapse(true);
            sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
            sel === null || sel === void 0 ? void 0 : sel.addRange(range);
        }
    }
    /**
     * Remove empty HTML tags (tags with no text content)
     * @param html The HTML string to clean
     * @returns Cleaned HTML string
     */
    cleanupEmptyTags(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html.trim();
        // Recursively remove empty elements
        const removeEmptyElements = (element) => {
            const children = Array.from(element.children);
            children.forEach(child => {
                var _a;
                removeEmptyElements(child);
                // Remove if element has no text content and no non-empty children
                const textContent = ((_a = child.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                if (textContent === '' && child.children.length === 0) {
                    child.remove();
                }
            });
        };
        removeEmptyElements(temp);
        return temp.innerHTML;
    }
    getFieldOrder() {
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
exports.MetadataForm = MetadataForm;
//# sourceMappingURL=MetadataForm.js.map