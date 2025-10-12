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
            solvent: document.getElementById('solvent-dropdown'),
            sortOrder: document.getElementById('sort-order-dropdown')
        };
        this.initializeValues();
        this.initializeEventListeners(onNavigateNext);
        this.initializeDropdowns();
    }
    initializeValues() {
        var _a;
        const data = this.metadataState.getData();
        this.elements.nuclei.innerHTML = data.nuclei;
        this.elements.solvent.innerHTML = data.solvent;
        this.elements.frequency.textContent = isNaN(data.frequency) ? '' : data.frequency.toString();
        this.elements.shiftPrecision.textContent = '';
        this.elements.jPrecision.textContent = '';
        // Set sort order display text (default: Descending)
        const sortOrderPreset = (_a = window.SORT_ORDER_PRESETS) === null || _a === void 0 ? void 0 : _a.find((p) => p.id === data.sortOrder);
        this.elements.sortOrder.innerHTML = (sortOrderPreset === null || sortOrderPreset === void 0 ? void 0 : sortOrderPreset.displayHTML) || 'Descending (High → Low)';
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
        // Sort order - read-only contenteditable with dropdown
        this.setupReadOnlyDropdownField(this.elements.sortOrder, (value) => {
            // Extract the sort order ID from the selected preset
            const presets = window.SORT_ORDER_PRESETS || [];
            const preset = presets.find((p) => p.displayHTML === value);
            if (preset) {
                this.metadataState.setSortOrder(preset.id);
            }
        }, onNavigateNext);
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
        // Enter, Tab, and Arrow key navigation
        element.addEventListener('keydown', (e) => {
            // Check if dropdown is active and has a highlighted item
            const fieldId = element.id;
            const dropdown = fieldId === 'nuclei' ? this.dropdowns.nuclei :
                fieldId === 'solvent' ? this.dropdowns.solvent :
                    fieldId === 'sort-order' ? this.dropdowns.sortOrder : null;
            if (e.key === 'Enter') {
                // If dropdown is active and has a highlighted item, let it handle Enter
                if (dropdown && dropdown.classList.contains('active')) {
                    const highlightedItem = dropdown.querySelector('.dropdown-item.highlighted');
                    if (highlightedItem) {
                        // Don't navigate, let dropdown handler select the item
                        return;
                    }
                }
                // Otherwise, navigate to next field within the same group
                e.preventDefault();
                this.navigateWithinGroup(element, e.shiftKey);
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.navigateWithinGroup(element, e.shiftKey);
                return;
            }
            // Smart left/right arrow navigation at boundaries
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0)
                    return;
                const range = selection.getRangeAt(0);
                const text = element.textContent || '';
                // Check if there's a selection
                const hasSelection = !range.collapsed;
                if (!hasSelection) {
                    const cursorPosition = this.getCursorPosition(element);
                    if (e.key === 'ArrowRight' && cursorPosition >= text.length) {
                        // At right boundary, move to next field within group
                        e.preventDefault();
                        const fieldGroup = this.getFieldGroup(element);
                        const fieldIndex = fieldGroup.indexOf(element);
                        if (fieldIndex < fieldGroup.length - 1) {
                            const nextField = fieldGroup[fieldIndex + 1];
                            nextField.focus();
                            this.moveCursorToStart(nextField);
                        }
                        return;
                    }
                    else if (e.key === 'ArrowLeft' && cursorPosition === 0) {
                        // At left boundary, move to previous field within group
                        e.preventDefault();
                        const fieldGroup = this.getFieldGroup(element);
                        const fieldIndex = fieldGroup.indexOf(element);
                        if (fieldIndex > 0) {
                            const prevField = fieldGroup[fieldIndex - 1];
                            prevField.focus();
                            this.moveCursorToEnd(prevField);
                        }
                        return;
                    }
                }
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
        // Enter, Tab, and Arrow key navigation
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Prevent default behavior and stop propagation to avoid input event
                e.stopPropagation();
                this.navigateWithinGroup(element, e.shiftKey);
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.navigateWithinGroup(element, e.shiftKey);
                return;
            }
            // Smart left/right arrow navigation at boundaries
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0)
                    return;
                const range = selection.getRangeAt(0);
                const text = element.textContent || '';
                // Check if there's a selection
                const hasSelection = !range.collapsed;
                if (!hasSelection) {
                    const cursorPosition = this.getCursorPosition(element);
                    if (e.key === 'ArrowRight' && cursorPosition >= text.length) {
                        // At right boundary, move to next field within group
                        e.preventDefault();
                        const fieldGroup = this.getFieldGroup(element);
                        const fieldIndex = fieldGroup.indexOf(element);
                        if (fieldIndex < fieldGroup.length - 1) {
                            const nextField = fieldGroup[fieldIndex + 1];
                            nextField.focus();
                            this.moveCursorToStart(nextField);
                        }
                        return;
                    }
                    else if (e.key === 'ArrowLeft' && cursorPosition === 0) {
                        // At left boundary, move to previous field within group
                        e.preventDefault();
                        const fieldGroup = this.getFieldGroup(element);
                        const fieldIndex = fieldGroup.indexOf(element);
                        if (fieldIndex > 0) {
                            const prevField = fieldGroup[fieldIndex - 1];
                            prevField.focus();
                            this.moveCursorToEnd(prevField);
                        }
                        return;
                    }
                }
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
        this.setupDropdown('sortOrder', window.SORT_ORDER_PRESETS || []);
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
        // Track selected index for keyboard navigation
        let selectedIndex = -1;
        // Show/hide dropdown
        input.addEventListener('focus', () => {
            dropdown.classList.add('active');
            selectedIndex = -1; // Reset selection on focus
        });
        input.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.classList.remove('active');
                // Clear highlight
                dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                    item.classList.remove('highlighted');
                });
            }, 200);
        });
        // Keyboard navigation for dropdown
        input.addEventListener('keydown', (e) => {
            if (!dropdown.classList.contains('active'))
                return;
            const items = Array.from(dropdown.querySelectorAll('.dropdown-item'));
            if (items.length === 0)
                return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this.highlightDropdownItem(items, selectedIndex);
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                this.highlightDropdownItem(items, selectedIndex);
            }
            else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const value = items[selectedIndex].getAttribute('data-value') || '';
                input.innerHTML = value;
                this.handleDropdownSelection(field, value);
                dropdown.classList.remove('active');
                // Clear highlight
                this.highlightDropdownItem(items, -1);
                selectedIndex = -1;
            }
        });
        // Handle selection
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const value = item.getAttribute('data-value') || '';
                input.innerHTML = value;
                this.handleDropdownSelection(field, value);
                dropdown.classList.remove('active');
            });
        });
    }
    /**
     * Highlight the selected dropdown item
     */
    highlightDropdownItem(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            }
            else {
                item.classList.remove('highlighted');
            }
        });
    }
    /**
     * Handle dropdown selection for different fields
     */
    handleDropdownSelection(field, value) {
        if (field === 'nuclei') {
            this.metadataState.setNuclei(value);
        }
        else if (field === 'solvent') {
            this.metadataState.setSolvent(value);
        }
        else if (field === 'sortOrder') {
            // Extract sort order ID from preset
            const presets = window.SORT_ORDER_PRESETS || [];
            const preset = presets.find((p) => p.displayHTML === value);
            if (preset) {
                this.metadataState.setSortOrder(preset.id);
            }
        }
    }
    /**
     * Get cursor position in contenteditable element
     */
    getCursorPosition(element) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return 0;
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
    }
    /**
     * Move cursor to start of element
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
    /**
     * Setup a read-only dropdown field (no text input, only dropdown selection)
     */
    setupReadOnlyDropdownField(element, onChange, onNavigateNext) {
        // Prevent any text input
        element.addEventListener('keydown', (e) => {
            // Check if dropdown is active and has a highlighted item
            const dropdown = this.dropdowns.sortOrder;
            // Allow navigation keys
            if (e.key === 'Enter') {
                // If dropdown is active and has a highlighted item, let it handle Enter
                if (dropdown && dropdown.classList.contains('active')) {
                    const highlightedItem = dropdown.querySelector('.dropdown-item.highlighted');
                    if (highlightedItem) {
                        // Don't navigate, let dropdown handler select the item
                        return;
                    }
                }
                // Otherwise, navigate within group (respects boundaries)
                e.preventDefault();
                this.navigateWithinGroup(element, e.shiftKey);
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.navigateWithinGroup(element, e.shiftKey);
                return;
            }
            // Allow arrow keys for dropdown navigation and field navigation
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                // Let dropdown handler manage this
                return;
            }
            // ArrowLeft should navigate to previous field within group
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const fieldGroup = this.getFieldGroup(element);
                const fieldIndex = fieldGroup.indexOf(element);
                if (fieldIndex > 0) {
                    const prevField = fieldGroup[fieldIndex - 1];
                    prevField.focus();
                    this.moveCursorToEnd(prevField);
                }
                return;
            }
            // ArrowRight should navigate to next field within group
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const fieldGroup = this.getFieldGroup(element);
                const fieldIndex = fieldGroup.indexOf(element);
                if (fieldIndex < fieldGroup.length - 1) {
                    const nextField = fieldGroup[fieldIndex + 1];
                    nextField.focus();
                    this.moveCursorToStart(nextField);
                }
                return;
            }
            // Prevent all other keys (no text input allowed)
            e.preventDefault();
        });
        // Prevent paste
        element.addEventListener('paste', (e) => {
            e.preventDefault();
        });
        // Prevent direct editing
        element.addEventListener('input', (e) => {
            e.preventDefault();
        });
        // Show dropdown on focus
        element.addEventListener('focus', () => {
            const dropdown = this.dropdowns.sortOrder;
            if (dropdown) {
                dropdown.classList.add('active');
            }
        });
        // Prevent text selection and cursor
        element.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            element.focus();
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
            // Find the last node (could be text or element)
            const lastNode = element.childNodes[element.childNodes.length - 1];
            if (lastNode.nodeType === Node.TEXT_NODE) {
                // Text node: set cursor at end
                const length = ((_a = lastNode.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0;
                range.setStart(lastNode, length);
            }
            else if (lastNode.nodeType === Node.ELEMENT_NODE) {
                // Element node: set cursor after it
                range.setStartAfter(lastNode);
            }
            else {
                // Fallback: set after last node
                range.setStartAfter(lastNode);
            }
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
        // Legacy method - returns all fields
        return [
            this.elements.nuclei,
            this.elements.solvent,
            this.elements.frequency,
            this.elements.shiftPrecision,
            this.elements.jPrecision,
            this.elements.sortOrder
        ];
    }
    /**
     * Get metadata fields order (group 1: nuclei → solvent → frequency)
     */
    getMetadataFieldOrder() {
        return [
            this.elements.nuclei,
            this.elements.solvent,
            this.elements.frequency
        ];
    }
    /**
     * Get settings fields order (group 2: shift-precision → j-precision → sort-order)
     */
    getSettingsFieldOrder() {
        return [
            this.elements.shiftPrecision,
            this.elements.jPrecision,
            this.elements.sortOrder
        ];
    }
    /**
     * Get the appropriate field group for the given element
     */
    getFieldGroup(element) {
        const metadataFields = this.getMetadataFieldOrder();
        const settingsFields = this.getSettingsFieldOrder();
        if (metadataFields.includes(element)) {
            return metadataFields;
        }
        else if (settingsFields.includes(element)) {
            return settingsFields;
        }
        return [];
    }
    /**
     * Navigate to next/previous field within the same group
     */
    /**
     * Navigate to next/previous field within the same group
     */
    navigateWithinGroup(element, reverse) {
        const fieldGroup = this.getFieldGroup(element);
        if (fieldGroup.length === 0)
            return;
        const currentIndex = fieldGroup.indexOf(element);
        if (currentIndex === -1)
            return;
        let targetIndex;
        if (reverse) {
            targetIndex = currentIndex - 1;
            // Don't wrap - stay at first field
            if (targetIndex < 0)
                return;
        }
        else {
            targetIndex = currentIndex + 1;
            // Don't wrap - stay at last field
            if (targetIndex >= fieldGroup.length)
                return;
        }
        const targetField = fieldGroup[targetIndex];
        targetField.focus();
        // Select all text in the target field
        this.selectAllText(targetField);
    }
    /**
     * Select all text in a contenteditable element
     */
    selectAllText(element) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(element);
        sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
        sel === null || sel === void 0 ? void 0 : sel.addRange(range);
    }
}
exports.MetadataForm = MetadataForm;
//# sourceMappingURL=MetadataForm.js.map