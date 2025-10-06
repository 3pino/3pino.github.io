// NMR Formatter Application - Phase 4.2 & 5
// Unidirectional conversion: Metadata + Table → Rich Text

class NMRFormatterApp {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTable();
    }

    initializeElements() {
        // Metadata inputs (contenteditable divs)
        this.metadataInputs = {
            nuclei: document.getElementById('nuclei'),
            solvent: document.getElementById('solvent'),
            frequency: document.getElementById('frequency'),
            shiftPrecision: document.getElementById('shift-precision'),
            jPrecision: document.getElementById('j-precision'),
            sortOrder: document.getElementById('sort-order')
        };

        // Metadata dropdowns
        this.metadataDropdowns = {
            nuclei: document.getElementById('nuclei-dropdown'),
            solvent: document.getElementById('solvent-dropdown')
        };

        // Table elements
        this.nmrTable = document.getElementById('nmr-table');
        this.nmrTableBody = document.getElementById('nmr-table-body');
        this.selectAllCheckbox = document.getElementById('select-all-checkbox');
        this.tableControls = {
            addPeak: document.getElementById('add-peak-btn'),
            removePeak: document.getElementById('remove-peak-btn')
        };

        // Rich text display (read-only)
        this.richTextEditor = document.getElementById('rich-text-editor');

        // Conversion buttons
        this.convertDownBtn = document.getElementById('convert-down-btn');
        this.convertUpBtn = document.getElementById('convert-up-btn');

        // Copy button
        this.copyBtn = document.getElementById('copy-btn');

        // Formatting buttons
        this.formatBtns = {
            bold: document.getElementById('format-bold-btn'),
            italic: document.getElementById('format-italic-btn'),
            sub: document.getElementById('format-sub-btn'),
            sup: document.getElementById('format-sup-btn'),
            endash: document.getElementById('insert-endash-btn')
        };
    }

    initializeEventListeners() {
        // Conversion button (↓ button: table → text)
        this.convertDownBtn.addEventListener('click', () => {
            this.generateFormattedText();
        });

        // Copy button
        this.copyBtn.addEventListener('click', () => {
            this.copyFormattedText();
        });

        // Table controls
        this.tableControls.addPeak.addEventListener('click', () => {
            this.addTableRow();
        });

        this.tableControls.removePeak.addEventListener('click', () => {
            this.removeSelectedRows();
        });

        // Select all checkbox
        this.selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = this.nmrTableBody.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
        });

        // Formatting toolbar - use mousedown to prevent blur
        this.formatBtns.bold.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('bold');
        });

        this.formatBtns.italic.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('italic');
        });

        this.formatBtns.sub.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('subscript');
        });

        this.formatBtns.sup.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyFormatting('superscript');
        });

        this.formatBtns.endash.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.insertEnDash();
        });

        // Metadata dropdown functionality
        this.initializeMetadataDropdowns();

        // Add error clearing for frequency field
        this.metadataInputs.frequency.addEventListener('input', () => {
            this.clearErrorHighlight(this.metadataInputs.frequency);
        });
    }

    initializeMetadataDropdowns() {
        // Populate nuclei dropdown from NUCLEI_PRESETS
        this.populateDropdown('nuclei', window.NUCLEI_PRESETS);

        // Populate solvent dropdown from SOLVENT_PRESETS
        this.populateDropdown('solvent', window.SOLVENT_PRESETS);

        // Setup event handlers for both dropdowns
        ['nuclei', 'solvent'].forEach(field => {
            const input = this.metadataInputs[field];
            const dropdown = this.metadataDropdowns[field];

            if (!input || !dropdown) {
                console.error(`Missing dropdown elements for ${field}`);
                return;
            }

            // Filter paste to allow only B/I/sub/sup tags
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');

                // Create temporary element to parse HTML
                const temp = document.createElement('div');
                temp.innerHTML = text;

                // Filter: keep only text and allowed tags (B, I, SUB, SUP)
                const filtered = this.filterHTMLTags(temp, ['B', 'I', 'SUB', 'SUP']);

                // Insert filtered content at cursor
                document.execCommand('insertHTML', false, filtered);
            });

            // Add keyboard shortcuts (Ctrl+B, Ctrl+I) for metadata fields
            input.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'b' || e.key === 'B') {
                        e.preventDefault();
                        this.applyFormatting('bold');
                    } else if (e.key === 'i' || e.key === 'I') {
                        e.preventDefault();
                        this.applyFormatting('italic');
                    }
                }
            });

            // Clear error highlighting on input
            input.addEventListener('input', () => {
                this.clearErrorHighlight(input);
            });

            // Show dropdown on focus
            input.addEventListener('focus', () => {
                dropdown.classList.add('active');
            });

            // Hide dropdown on blur (with delay to allow click)
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    dropdown.classList.remove('active');
                }, 200);
            });

            // Handle dropdown item selection
            dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('mousedown', (e) => {
                    // Use mousedown instead of click to prevent blur from firing first
                    e.preventDefault();
                    const value = item.getAttribute('data-value');
                    input.innerHTML = value;
                    dropdown.classList.remove('active');
                });
            });
        });
    }

    populateDropdown(field, presets) {
        const dropdown = this.metadataDropdowns[field];
        if (!dropdown || !presets) {
            console.error(`Cannot populate dropdown for ${field}`);
            return;
        }

        // Clear existing items
        dropdown.innerHTML = '';

        // Add items from presets
        presets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.setAttribute('data-value', preset.displayHTML);
            item.innerHTML = preset.displayHTML;
            dropdown.appendChild(item);
        });
    }

    filterHTMLTags(element, allowedTags) {
        let result = '';

        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toUpperCase();
                if (allowedTags.includes(tagName)) {
                    result += `<${tagName.toLowerCase()}>${this.filterHTMLTags(node, allowedTags)}</${tagName.toLowerCase()}>`;
                } else {
                    result += this.filterHTMLTags(node, allowedTags);
                }
            }
        });

        return result;
    }

    initializeTable() {
        // Set default nuclei value
        this.metadataInputs.nuclei.innerHTML = '<sup>1</sup>H';

        // Add initial empty row
        this.addTableRow();
    }

    // ========== TABLE MANAGEMENT ==========

    addTableRow() {
        const row = document.createElement('tr');

        // Create basic structure
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'checkbox-cell';
        checkboxCell.innerHTML = '<input type="checkbox" class="row-checkbox">';

        const shiftCell = document.createElement('td');
        shiftCell.innerHTML = '<input type="text" class="shift-input" placeholder="0.00 or 7.53–7.50">';

        const multCell = document.createElement('td');
        multCell.innerHTML = '<input type="text" class="mult-input" placeholder="s, d, t...">';

        const intCell = document.createElement('td');
        intCell.className = 'int-cell';
        intCell.innerHTML = '<input type="number" step="1" class="int-input" placeholder="1">';

        const assignmentCell = document.createElement('td');
        assignmentCell.className = 'assignment-cell';
        assignmentCell.innerHTML = '<div class="assignment-input" contenteditable="true" data-placeholder="e.g., H-8"></div>';

        row.appendChild(checkboxCell);
        row.appendChild(shiftCell);
        row.appendChild(multCell);

        // Add 10 J-value cells (initially hidden)
        const MAX_J_CELLS = 10;
        for (let i = 0; i < MAX_J_CELLS; i++) {
            const jCell = document.createElement('td');
            jCell.className = 'j-input-cell';
            jCell.style.display = 'none'; // Initially hidden

            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.1';
            input.className = 'j-input';
            input.setAttribute('data-j-index', i);
            input.placeholder = '0.0';

            jCell.appendChild(input);

            // Add click handler to focus input when td is clicked
            jCell.addEventListener('click', (e) => {
                if (e.target === jCell) {
                    input.focus();
                }
            });

            row.appendChild(jCell);
        }

        row.appendChild(intCell);
        row.appendChild(assignmentCell);

        // Get input elements (must be done after cells are created)
        const shiftInput = shiftCell.querySelector('.shift-input');
        const multInput = multCell.querySelector('.mult-input');
        const intInput = intCell.querySelector('.int-input');
        const assignmentInput = assignmentCell.querySelector('.assignment-input');

        // Update entire table when multiplicity changes
        multInput.addEventListener('input', () => {
            this.updateEntireTable();
        });

        // Setup Assignment field formatting support
        assignmentInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
            const temp = document.createElement('div');
            temp.innerHTML = text;
            const filtered = this.filterHTMLTags(temp, ['B', 'I', 'SUB', 'SUP']);
            document.execCommand('insertHTML', false, filtered);
        });

        // Arrow key navigation and keyboard shortcuts for assignment field
        assignmentInput.addEventListener('keydown', (e) => {
            // Keyboard shortcuts (Ctrl+B, Ctrl+I)
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    this.applyFormatting('bold');
                    return;
                } else if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    this.applyFormatting('italic');
                    return;
                }
            }

            // Arrow key navigation
            this.handleCellNavigation(e, assignmentInput, row);
        });

        // Arrow key navigation and error clearing for regular inputs
        shiftInput.addEventListener('keydown', (e) => {
            this.handleCellNavigation(e, shiftInput, row);
        });
        shiftInput.addEventListener('input', () => {
            this.clearErrorHighlight(shiftInput);
        });

        multInput.addEventListener('keydown', (e) => {
            this.handleCellNavigation(e, multInput, row);
        });
        multInput.addEventListener('input', () => {
            this.clearErrorHighlight(multInput);
        });

        intInput.addEventListener('keydown', (e) => {
            this.handleCellNavigation(e, intInput, row);
        });
        intInput.addEventListener('input', () => {
            this.clearErrorHighlight(intInput);
        });

        // J-value inputs navigation (added dynamically)
        const jInputs = row.querySelectorAll('.j-input');
        jInputs.forEach(jInput => {
            jInput.addEventListener('keydown', (e) => {
                this.handleCellNavigation(e, jInput, row);
            });
            jInput.addEventListener('input', () => {
                this.clearErrorHighlight(jInput);
            });
        });

        // Add click handlers to focus inputs when td is clicked
        [shiftCell, multCell, intCell].forEach(td => {
            td.addEventListener('click', (e) => {
                if (e.target === td) {
                    const input = td.querySelector('input');
                    if (input) {
                        input.focus();
                    }
                }
            });
        });

        // Assignment cell click handler
        assignmentCell.addEventListener('click', (e) => {
            if (e.target === assignmentCell) {
                assignmentInput.focus();
            }
        });

        this.nmrTableBody.appendChild(row);

        // Update entire table to maintain consistency
        this.updateEntireTable();
    }

    /**
     * Calculate required J-value columns for a given multiplicity
     * @param {string} multiplicity - Multiplicity string (e.g., "d", "dd", "s", or "23")
     * @returns {number} - Number of required J-value columns (0 if none needed)
     */
    calculateRequiredJColumns(multiplicity) {
        if (!multiplicity || multiplicity.trim() === '') {
            return 0;
        }

        // Convert numeric multiplicity to text first
        const multiplicityText = this.convertMultiplicityToText(multiplicity.trim());

        try {
            const jCounts = multipletnumbers(multiplicityText);
            if (jCounts === null) {
                // Singlet, multiplet, broad - no J values
                return 0;
            }
            return jCounts.length;
        } catch (error) {
            // Invalid multiplicity
            console.warn('Invalid multiplicity:', multiplicity, error.message);
            return 0;
        }
    }

    /**
     * Update entire table - unified function for all J-column management
     *
     * This is the core function that maintains consistency across all table rows.
     * Called after any operation: multiplicity change, add row, remove row.
     *
     * Algorithm:
     * 1. Calculate required J-columns for each row based on multiplicity
     * 2. Determine table-wide maximum J-columns
     * 3. Update all cells in all rows:
     *    - Active cells (required by multiplicity): white background, enabled
     *    - Placeholder cells (to match table max): gray background, disabled
     *    - Hidden cells (beyond table max): hidden, disabled
     * 4. Update table header to match
     *
     * This ensures:
     * - All rows have the same number of visible J-columns
     * - J-values are preserved even when cells become placeholders
     * - Tab navigation skips disabled placeholder cells
     * - Generate Text only uses J-values from active cells
     */
    updateEntireTable() {
        const rows = this.nmrTableBody.querySelectorAll('tr');

        // Step 1: Calculate required J columns for each row
        const rowRequirements = [];
        rows.forEach(row => {
            const multInput = row.querySelector('.mult-input');
            const multiplicity = multInput ? multInput.value.trim() : '';
            const required = this.calculateRequiredJColumns(multiplicity);
            rowRequirements.push(required);
        });

        // Step 2: Determine table-wide maximum J columns
        const tableMaxJ = Math.max(0, ...rowRequirements);
        this.maxJColumns = tableMaxJ;

        // Step 3: Update all cells in all rows
        rows.forEach((row, rowIndex) => {
            const jCells = row.querySelectorAll('.j-input-cell');
            const requiredForThisRow = rowRequirements[rowIndex];

            jCells.forEach((cell, cellIndex) => {
                const input = cell.querySelector('.j-input');

                if (cellIndex < requiredForThisRow) {
                    // Active cell (white background, enabled)
                    cell.style.display = '';
                    cell.classList.remove('disabled');
                    if (input) input.disabled = false;
                } else if (cellIndex < tableMaxJ) {
                    // Placeholder cell (gray background, disabled, not focusable)
                    cell.style.display = '';
                    cell.classList.add('disabled');
                    if (input) input.disabled = true;
                } else {
                    // Hidden cell (not displayed, disabled)
                    cell.style.display = 'none';
                    cell.classList.remove('disabled');
                    if (input) input.disabled = true;
                }
            });
        });

        // Step 4: Update table header
        this.updateTableHeader();
    }

    updateTableHeader() {
        // Find maximum number of VISIBLE J columns across all rows
        let maxJColumns = 0;
        const rows = this.nmrTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const jCells = row.querySelectorAll('.j-input-cell');
            let visibleCount = 0;
            jCells.forEach(cell => {
                if (cell.style.display !== 'none') {
                    visibleCount++;
                }
            });
            maxJColumns = Math.max(maxJColumns, visibleCount);
        });

        // Store for later use
        this.maxJColumns = maxJColumns;

        // Update header row
        const thead = this.nmrTable.querySelector('thead tr');

        // Remove existing J headers
        const existingJHeaders = thead.querySelectorAll('.j-header');
        existingJHeaders.forEach(header => header.remove());

        // Add J headers BEFORE Integration
        const intHeader = thead.querySelector('.integration-header');
        for (let i = 0; i < maxJColumns; i++) {
            const jHeader = document.createElement('th');
            jHeader.className = 'j-header';
            jHeader.textContent = `J${i + 1} (Hz)`;
            intHeader.insertAdjacentElement('beforebegin', jHeader);
        }
    }

    removeSelectedRows() {
        const selectedCheckboxes = this.nmrTableBody.querySelectorAll('.row-checkbox:checked');
        selectedCheckboxes.forEach(cb => {
            cb.closest('tr').remove();
        });

        // Reset select-all checkbox
        this.selectAllCheckbox.checked = false;

        // Ensure at least one row exists
        if (this.nmrTableBody.children.length === 0) {
            this.addTableRow();
        } else {
            // Update entire table after row removal
            this.updateEntireTable();
        }
    }

    // ========== MULTIPLICITY CONVERSION ==========

    /**
     * Convert numeric multiplicity to text
     * @param {string} input - Input string (e.g., "23" or "dt")
     * @returns {string} - Multiplicity text (e.g., "dt")
     */
    convertMultiplicityToText(input) {
        if (!input || input.trim() === '') return '';

        const trimmed = input.trim();

        // Check if input is purely numeric
        if (/^\d+$/.test(trimmed)) {
            // Convert each digit to multiplicity letter
            const digitMap = {
                '1': 's',
                '2': 'd',
                '3': 't',
                '4': 'q',
                '5': 'quint'
            };

            let result = '';
            for (const digit of trimmed) {
                if (digit >= '1' && digit <= '5') {
                    result += digitMap[digit];
                }
                // Ignore digits 6 and above
            }

            return result;
        }

        // Already text format, return as is
        return trimmed;
    }

    // ========== DATA EXTRACTION ==========

    /**
     * Parse chemical shift input value
     * Supports single value (e.g., "7.53") or range (e.g., "7.53-7.50" or "7.53–7.50")
     * @param {string} value - Input value
     * @returns {number | [number, number] | null} - Parsed value or null if invalid
     */
    parseChemicalShift(value) {
        if (!value || value.trim() === '') return null;

        const trimmed = value.trim();

        // Check for range format (supports both hyphen and en-dash)
        const rangeMatch = trimmed.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
        if (rangeMatch) {
            const num1 = parseFloat(rangeMatch[1]);
            const num2 = parseFloat(rangeMatch[2]);
            if (!isNaN(num1) && !isNaN(num2)) {
                return [num1, num2];
            }
        }

        // Single value
        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
            return num;
        }

        return null;
    }

    /**
     * Get numeric value for sorting from chemical shift
     * For ranges, returns the average value
     * @param {number | [number, number]} shift - Chemical shift value
     * @returns {number} - Numeric value for sorting
     */
    getShiftValue(shift) {
        if (Array.isArray(shift)) {
            return (shift[0] + shift[1]) / 2;
        }
        return shift;
    }

    getMetadataFromInputs() {
        // For contenteditable divs, use innerHTML to preserve HTML tags
        const nuclei = this.metadataInputs.nuclei.innerHTML.trim();
        const solvent = this.metadataInputs.solvent.innerHTML.trim();
        const frequency = parseFloat(this.metadataInputs.frequency.value) || 0;

        return new Metadata(nuclei, solvent, frequency);
    }

    getPeaksFromTable() {
        const rows = this.nmrTableBody.querySelectorAll('tr');
        const peaks = [];

        rows.forEach(row => {
            const shiftInput = row.querySelector('.shift-input');
            const multInput = row.querySelector('.mult-input');
            const intInput = row.querySelector('.int-input');
            const assignmentInput = row.querySelector('.assignment-input');
            const jInputs = row.querySelectorAll('.j-input');

            // Parse chemical shift (supports single value or range)
            const shiftValue = this.parseChemicalShift(shiftInput.value);
            // Convert numeric multiplicity to text (e.g., "23" -> "dt")
            const multiplicityInput = multInput.value.trim();
            const multiplicity = this.convertMultiplicityToText(multiplicityInput);
            const integration = parseFloat(intInput.value) || 0;
            // For contenteditable, use innerHTML to preserve formatting
            const assignment = assignmentInput ? assignmentInput.innerHTML.trim() : "";

            // Extract J-values (only from enabled inputs) and auto-correct
            const jValues = [];
            jInputs.forEach(jInput => {
                // Skip disabled inputs (placeholder cells)
                if (jInput.disabled) {
                    return;
                }

                const jValue = parseFloat(jInput.value);
                if (!isNaN(jValue)) {
                    // Auto-correct: convert to absolute value
                    const absValue = Math.abs(jValue);
                    jValues.push(absValue);

                    // Update input with absolute value
                    if (jValue !== absValue) {
                        jInput.value = absValue;
                    }
                }
            });

            // Auto-correct: sort J-values in descending order
            jValues.sort((a, b) => b - a);

            // Update J-value inputs with sorted values
            let jIndex = 0;
            jInputs.forEach(jInput => {
                if (jInput.disabled) return;

                if (jIndex < jValues.length) {
                    jInput.value = jValues[jIndex];
                    jIndex++;
                }
            });

            // Only add peak if chemical shift is valid
            if (shiftValue !== null) {
                const peak = new NMRPeak(shiftValue, multiplicity, jValues, integration, assignment);
                peaks.push(peak);
            }
        });

        return peaks;
    }

    // ========== SORTING ==========

    /**
     * Sort peaks by chemical shift
     * For ranges, uses the average value for sorting
     * @param {Array} peaks - Array of NMRPeak objects
     * @param {string} order - 'asc' for ascending, 'desc' for descending
     */
    sortPeaksByShift(peaks, order = 'desc') {
        peaks.sort((a, b) => {
            const aValue = this.getShiftValue(a.chemicalShift);
            const bValue = this.getShiftValue(b.chemicalShift);

            if (order === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }

    // ========== VALIDATION ==========

    /**
     * Validate table data and highlight errors in red
     * Only called when Generate Text is clicked
     * @returns {boolean} - True if errors found, false otherwise
     */
    validateAndHighlightTable() {
        const rows = this.nmrTableBody.querySelectorAll('tr');
        let hasErrors = false;

        // Validate metadata fields
        const nucleiValue = this.metadataInputs.nuclei.textContent.trim();
        if (nucleiValue === '') {
            this.metadataInputs.nuclei.classList.add('error');
            hasErrors = true;
        } else {
            this.metadataInputs.nuclei.classList.remove('error');
        }

        const solventValue = this.metadataInputs.solvent.textContent.trim();
        if (solventValue === '') {
            this.metadataInputs.solvent.classList.add('error');
            hasErrors = true;
        } else {
            this.metadataInputs.solvent.classList.remove('error');
        }

        const frequencyValue = this.metadataInputs.frequency.value.trim();
        if (frequencyValue === '' || isNaN(parseFloat(frequencyValue))) {
            this.metadataInputs.frequency.classList.add('error');
            hasErrors = true;
        } else {
            this.metadataInputs.frequency.classList.remove('error');
        }

        // Validate table rows
        rows.forEach(row => {
            const shiftInput = row.querySelector('.shift-input');
            const multInput = row.querySelector('.mult-input');
            const intInput = row.querySelector('.int-input');
            const jInputs = row.querySelectorAll('.j-input:not([disabled])');

            // Validate chemical shift
            const shiftValue = this.parseChemicalShift(shiftInput.value);
            if (shiftValue === null || shiftInput.value.trim() === '') {
                shiftInput.classList.add('error');
                hasErrors = true;
            } else {
                shiftInput.classList.remove('error');
            }

            // Validate multiplicity (only for 1H NMR)
            const nucleiValue = this.metadataInputs.nuclei.textContent.trim();
            const is1HNMR = nucleiValue.includes('1') && nucleiValue.includes('H');

            const multiplicityInput = multInput.value.trim();
            const multiplicity = this.convertMultiplicityToText(multiplicityInput);

            // Check if multiplicity is valid
            let isValidMultiplicity = false;
            if (multiplicityInput === '') {
                // Empty multiplicity is invalid (only for 1H NMR)
                isValidMultiplicity = !is1HNMR;
            } else {
                try {
                    // Try to get J-counts to validate
                    const jCounts = multipletnumbers(multiplicity);
                    isValidMultiplicity = true; // Valid if no error
                } catch (error) {
                    isValidMultiplicity = false;
                }
            }

            if (!isValidMultiplicity && is1HNMR) {
                multInput.classList.add('error');
                hasErrors = true;
            } else {
                multInput.classList.remove('error');
            }

            // Validate integration (only for 1H NMR)
            const integrationValue = intInput.value.trim();
            if ((integrationValue === '' || isNaN(parseFloat(integrationValue))) && is1HNMR) {
                intInput.classList.add('error');
                hasErrors = true;
            } else {
                intInput.classList.remove('error');
            }

            // Validate J-values (with optional J-value support for m/br/broad)
            const isOptional = multiplicity && isJValuesOptional(multiplicity);
            const actualJCount = Array.from(jInputs).filter(input => {
                const val = input.value.trim();
                return val !== '' && !isNaN(parseFloat(val));
            }).length;
            
            // If optional: allow 0 or all J-values filled
            // If not optional: all J-values must be filled
            if (isOptional) {
                // Optional: either all empty or all filled
                if (actualJCount > 0 && actualJCount < jInputs.length) {
                    // Partial fill - mark empties as errors
                    jInputs.forEach(jInput => {
                        const jValue = jInput.value.trim();
                        if (jValue === '' || isNaN(parseFloat(jValue))) {
                            jInput.classList.add('error');
                            hasErrors = true;
                        } else {
                            jInput.classList.remove('error');
                        }
                    });
                } else {
                    // All empty or all filled - OK
                    jInputs.forEach(jInput => {
                        jInput.classList.remove('error');
                    });
                }
            } else {
                // Not optional: all must be filled
                jInputs.forEach(jInput => {
                    const jValue = jInput.value.trim();
                    if (jValue === '' || isNaN(parseFloat(jValue))) {
                        jInput.classList.add('error');
                        hasErrors = true;
                    } else {
                        jInput.classList.remove('error');
                    }
                });
            }
        });

        return hasErrors;
    }

    /**
     * Clear error highlighting from an input
     * Called when user edits a field
     */
    clearErrorHighlight(input) {
        input.classList.remove('error');
    }

    // ========== TEXT GENERATION ==========

    generateFormattedText() {
        try {
            // First, validate and highlight errors
            const hasErrors = this.validateAndHighlightTable();

            // Even with errors, we can still generate text with valid data
            const metadata = this.getMetadataFromInputs();
            const peaks = this.getPeaksFromTable();

            if (peaks.length === 0) {
                this.richTextEditor.innerHTML = '<span style="color: #999;">No valid peaks to display. Add peak data in the table above.</span>';
                return;
            }

            // Sort peaks by chemical shift (δ) using selected order
            const sortOrder = this.metadataInputs.sortOrder.value || 'desc';
            this.sortPeaksByShift(peaks, sortOrder);

            const nmrData = new NMRData(peaks, metadata);

            const shiftPrecision = parseInt(this.metadataInputs.shiftPrecision.value) || 2;
            const jPrecision = parseInt(this.metadataInputs.jPrecision.value) || 1;

            const formattedText = generateFormattedText(nmrData, shiftPrecision, jPrecision, 0);

            this.richTextEditor.innerHTML = formattedText;

            if (hasErrors) {
                console.log('Generated text with validation errors present');
            }

        } catch (error) {
            console.error('Error generating formatted text:', error);
            this.richTextEditor.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        }
    }

    copyFormattedText() {
        const richTextContent = this.richTextEditor.innerHTML;

        if (!richTextContent || richTextContent.trim() === '') {
            alert('No formatted text to copy. Generate text first.');
            return;
        }

        // Create a temporary element to copy HTML content
        const tempElement = document.createElement('div');
        tempElement.innerHTML = richTextContent;
        document.body.appendChild(tempElement);

        // Select the content
        const range = document.createRange();
        range.selectNodeContents(tempElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        try {
            // Copy to clipboard
            document.execCommand('copy');

            // Show feedback
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            this.copyBtn.style.backgroundColor = '#28a745';
            this.copyBtn.style.color = 'white';

            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.backgroundColor = '';
                this.copyBtn.style.color = '';
            }, 2000);

        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy to clipboard');
        } finally {
            // Clean up
            document.body.removeChild(tempElement);
            selection.removeAllRanges();
        }
    }

    // ========== FORMATTING FUNCTIONS ==========

    /**
     * Apply formatting (bold, italic, subscript, superscript) to selected text
     * Only works in contenteditable fields (nuclei, solvent, assignment)
     */
    applyFormatting(command) {
        const activeElement = document.activeElement;

        // Check if active element is a contenteditable field
        if (!activeElement || activeElement.getAttribute('contenteditable') !== 'true') {
            console.log('Format button clicked, but no contenteditable element is focused');
            return;
        }

        // Save selection before button click
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            console.log('No selection found');
            return;
        }

        // Apply formatting
        document.execCommand(command, false, null);

        // Return focus to the field
        activeElement.focus();
    }

    /**
     * Insert en-dash (–) at cursor position
     * Only works in contenteditable fields
     */
    insertEnDash() {
        const activeElement = document.activeElement;

        // Check if active element is a contenteditable field
        if (!activeElement || activeElement.getAttribute('contenteditable') !== 'true') {
            return;
        }

        // Insert en-dash
        document.execCommand('insertHTML', false, '–');

        // Return focus to the field
        activeElement.focus();
    }

    // ========== NAVIGATION FUNCTIONS ==========

    /**
     * Handle arrow key navigation between cells
     * @param {KeyboardEvent} e - Keyboard event
     * @param {HTMLElement} currentInput - Current input/contenteditable element
     * @param {HTMLElement} currentRow - Current table row
     */
    handleCellNavigation(e, currentInput, currentRow) {
        const key = e.key;

        // Handle Tab and Shift+Tab navigation
        if (key === 'Tab') {
            const isShiftTab = e.shiftKey;
            const currentCell = currentInput.closest('td');

            // Special handling for Assignment -> next row's delta
            if (currentInput.classList.contains('assignment-input') && !isShiftTab) {
                e.preventDefault();
                const nextRow = currentRow.nextElementSibling;
                if (nextRow) {
                    const nextShiftInput = nextRow.querySelector('.shift-input');
                    if (nextShiftInput) {
                        nextShiftInput.focus();
                    }
                }
                return;
            }

            // Special handling for delta -> previous row's assignment
            if (currentInput.classList.contains('shift-input') && isShiftTab) {
                e.preventDefault();
                const prevRow = currentRow.previousElementSibling;
                if (prevRow) {
                    const prevAssignmentInput = prevRow.querySelector('.assignment-input');
                    if (prevAssignmentInput) {
                        prevAssignmentInput.focus();
                    }
                }
                return;
            }

            // Default tab behavior for other cells
            return;
        }

        // Arrow key navigation
        if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            const isContentEditable = currentInput.getAttribute('contenteditable') === 'true';

            // For contenteditable, check cursor position
            if (isContentEditable) {
                const selection = window.getSelection();
                const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                const text = currentInput.textContent || '';
                const cursorPosition = range ? range.startOffset : 0;

                // ArrowUp: move to cell above
                if (key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateToCell(currentRow, currentInput, 'up');
                    return;
                }

                // ArrowDown: move to cell below
                if (key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateToCell(currentRow, currentInput, 'down');
                    return;
                }

                // ArrowRight: move to cell on right if at end
                if (key === 'ArrowRight' && cursorPosition >= text.length) {
                    e.preventDefault();
                    this.navigateToCell(currentRow, currentInput, 'right');
                    return;
                }

                // ArrowLeft: move to cell on left if at start
                if (key === 'ArrowLeft' && cursorPosition === 0) {
                    e.preventDefault();
                    this.navigateToCell(currentRow, currentInput, 'left');
                    return;
                }
            } else {
                // For regular inputs
                const isNumberInput = currentInput.type === 'number';

                // For number inputs, always override arrow keys
                if (isNumberInput) {
                    // ArrowUp: move to cell above
                    if (key === 'ArrowUp') {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'up');
                        return;
                    }

                    // ArrowDown: move to cell below
                    if (key === 'ArrowDown') {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'down');
                        return;
                    }

                    // ArrowRight: move to cell on right
                    if (key === 'ArrowRight') {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'right');
                        return;
                    }

                    // ArrowLeft: move to cell on left
                    if (key === 'ArrowLeft') {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'left');
                        return;
                    }
                } else {
                    // For text inputs, check cursor position
                    const cursorPosition = currentInput.selectionStart;
                    const text = currentInput.value || '';

                    // ArrowUp: move to cell above
                    if (key === 'ArrowUp') {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'up');
                        return;
                    }

                    // ArrowDown: move to cell below
                    if (key === 'ArrowDown') {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'down');
                        return;
                    }

                    // ArrowRight: move to cell on right if at end
                    if (key === 'ArrowRight' && cursorPosition >= text.length) {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'right');
                        return;
                    }

                    // ArrowLeft: move to cell on left if at start
                    if (key === 'ArrowLeft' && cursorPosition === 0) {
                        e.preventDefault();
                        this.navigateToCell(currentRow, currentInput, 'left');
                        return;
                    }
                }
            }
        }
    }

    /**
     * Navigate to adjacent cell
     * @param {HTMLElement} currentRow - Current table row
     * @param {HTMLElement} currentInput - Current input element
     * @param {string} direction - 'up', 'down', 'left', 'right'
     */
    navigateToCell(currentRow, currentInput, direction) {
        const currentCell = currentInput.closest('td');

        if (direction === 'up' || direction === 'down') {
            const targetRow = direction === 'up'
                ? currentRow.previousElementSibling
                : currentRow.nextElementSibling;

            if (!targetRow) return;

            // Find corresponding cell in target row
            const cellIndex = Array.from(currentRow.children).indexOf(currentCell);
            const targetCell = targetRow.children[cellIndex];

            if (!targetCell) return;

            const targetInput = targetCell.querySelector('input, [contenteditable="true"]');
            if (targetInput) {
                targetInput.focus();
            }
        } else if (direction === 'left' || direction === 'right') {
            // Find all visible editable cells in current row (skip checkbox and hidden cells)
            const allCells = Array.from(currentRow.querySelectorAll('td:not(.checkbox-cell)'));

            // Filter to only visible cells with enabled inputs
            const visibleCells = allCells.filter(cell => {
                if (cell.style.display === 'none') return false;
                const input = cell.querySelector('input, [contenteditable="true"]');
                if (!input) return false;
                if (input.disabled) return false;
                return true;
            });

            const currentIndex = visibleCells.indexOf(currentCell);

            if (currentIndex === -1) return;

            const targetIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;

            if (targetIndex < 0 || targetIndex >= visibleCells.length) return;

            const targetCell = visibleCells[targetIndex];
            const targetInput = targetCell.querySelector('input:not([disabled]), [contenteditable="true"]');

            if (targetInput) {
                targetInput.focus();

                // For contenteditable, set cursor position
                if (targetInput.getAttribute('contenteditable') === 'true') {
                    const range = document.createRange();
                    const sel = window.getSelection();
                    const textNode = targetInput.firstChild;

                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                        if (direction === 'right') {
                            range.setStart(textNode, 0);
                        } else {
                            range.setStart(textNode, textNode.length);
                        }
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                } else {
                    // For regular input, set cursor position (skip for number inputs)
                    if (targetInput.type !== 'number') {
                        if (direction === 'right') {
                            targetInput.setSelectionRange(0, 0);
                        } else {
                            const len = targetInput.value.length;
                            targetInput.setSelectionRange(len, len);
                        }
                    }
                }
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NMRFormatterApp();
    console.log('NMR Formatter App initialized (Phase 4.2)');
});
