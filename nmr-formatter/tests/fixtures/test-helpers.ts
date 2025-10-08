import { Page, Locator } from '@playwright/test';

/**
 * Helper class for interacting with metadata form fields
 */
export class MetadataFormHelper {
  readonly page: Page;
  readonly nuclei: Locator;
  readonly solvent: Locator;
  readonly frequency: Locator;
  readonly shiftPrecision: Locator;
  readonly jPrecision: Locator;
  readonly sortOrder: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nuclei = page.locator('#nuclei');
    this.solvent = page.locator('#solvent');
    this.frequency = page.locator('#frequency');
    this.shiftPrecision = page.locator('#shift-precision');
    this.jPrecision = page.locator('#j-precision');
    this.sortOrder = page.locator('#sort-order');
  }

  /**
   * Navigate to the app
   */
  async goto() {
    await this.page.goto('file://' + process.cwd() + '/app.html');
    // Wait for the app to initialize
    await this.page.waitForSelector('#nuclei');
  }

  /**
   * Get the placeholder attribute value
   */
  async getPlaceholder(field: Locator): Promise<string> {
    return await field.getAttribute('data-placeholder') || '';
  }

  /**
   * Check if field is showing placeholder (empty content)
   */
  async isPlaceholderVisible(field: Locator): Promise<boolean> {
    const content = await field.textContent();
    const innerHTML = await field.innerHTML();
    return (content === '' || content === null) && (innerHTML === '' || innerHTML === '<br>');
  }

  /**
   * Get inner HTML of a field
   */
  async getInnerHTML(field: Locator): Promise<string> {
    return await field.innerHTML();
  }

  /**
   * Get text content of a field
   */
  async getTextContent(field: Locator): Promise<string> {
    return await field.textContent() || '';
  }

  /**
   * Clear a contenteditable field
   */
  async clearField(field: Locator) {
    await field.click();
    await field.press('Control+A');
    await field.press('Backspace');
  }

  /**
   * Type text into a contenteditable field
   */
  async typeInto(field: Locator, text: string) {
    await field.click();
    await field.type(text);
  }

  /**
   * Check if field has error class
   */
  async hasError(field: Locator): Promise<boolean> {
    const className = await field.getAttribute('class');
    return className?.includes('error') || false;
  }

  /**
   * Get all metadata field elements in tab order
   */
  getFieldsInOrder(): Locator[] {
    return [
      this.nuclei,
      this.solvent,
      this.frequency,
      this.shiftPrecision,
      this.jPrecision,
      this.sortOrder
    ];
  }
}

/**
 * Helper class for interacting with table section
 */
export class TableHelper {
  readonly page: Page;
  readonly addPeakBtn: Locator;
  readonly tableBody: Locator;
  readonly generateTextBtn: Locator;

  // Formatting toolbar
  readonly boldBtn: Locator;
  readonly italicBtn: Locator;
  readonly subBtn: Locator;
  readonly supBtn: Locator;
  readonly endashBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addPeakBtn = page.locator('#add-peak-btn');
    this.tableBody = page.locator('#nmr-table-body');
    this.generateTextBtn = page.locator('#convert-down-btn');

    // Formatting toolbar buttons
    this.boldBtn = page.locator('#format-bold-btn');
    this.italicBtn = page.locator('#format-italic-btn');
    this.subBtn = page.locator('#format-sub-btn');
    this.supBtn = page.locator('#format-sup-btn');
    this.endashBtn = page.locator('#insert-endash-btn');
  }

  /**
   * Navigate to the app
   */
  async goto() {
    await this.page.goto('file://' + process.cwd() + '/app.html');
    // Wait for the table to initialize
    await this.page.waitForSelector('#nmr-table-body');
  }

  /**
   * Get a specific row by index (0-based)
   */
  getRow(index: number): Locator {
    return this.tableBody.locator('tr').nth(index);
  }

  /**
   * Get shift input for a specific row
   */
  getShiftInput(rowIndex: number): Locator {
    return this.getRow(rowIndex).locator('.shift-input');
  }

  /**
   * Get multiplicity input for a specific row
   */
  getMultiplicityInput(rowIndex: number): Locator {
    return this.getRow(rowIndex).locator('.mult-input');
  }

  /**
   * Get J-value input for a specific row and J-index (0-based)
   */
  getJInput(rowIndex: number, jIndex: number): Locator {
    return this.getRow(rowIndex).locator(`.j-input[data-j-index="${jIndex}"]`);
  }

  /**
   * Get integration input for a specific row
   */
  getIntegrationInput(rowIndex: number): Locator {
    return this.getRow(rowIndex).locator('.int-input');
  }

  /**
   * Get assignment input (contenteditable) for a specific row
   */
  getAssignmentInput(rowIndex: number): Locator {
    return this.getRow(rowIndex).locator('.assignment-input');
  }

  /**
   * Get delete button for a specific row
   */
  getDeleteButton(rowIndex: number): Locator {
    return this.getRow(rowIndex).locator('.delete-row-btn');
  }

  /**
   * Click "Add Peak" button to add a new row
   */
  async addRow(): Promise<void> {
    await this.addPeakBtn.click();
  }

  /**
   * Delete a specific row by clicking its delete button
   */
  async deleteRow(rowIndex: number): Promise<void> {
    await this.getDeleteButton(rowIndex).click();
  }

  /**
   * Get the total number of rows in the table
   */
  async getRowCount(): Promise<number> {
    return await this.tableBody.locator('tr').count();
  }

  /**
   * Get the number of visible J-columns (by checking header)
   */
  async getVisibleJColumnCount(): Promise<number> {
    const jHeaders = this.page.locator('#nmr-table thead th').filter({ hasText: /^J\d+$/ });
    const count = await jHeaders.count();
    let visibleCount = 0;

    for (let i = 0; i < count; i++) {
      const header = jHeaders.nth(i);
      const display = await header.evaluate((el) => window.getComputedStyle(el).display);
      if (display !== 'none') {
        visibleCount++;
      }
    }

    return visibleCount;
  }

  /**
   * Check if a specific J-column is visible (by checking header)
   */
  async isJColumnVisible(jIndex: number): Promise<boolean> {
    const jHeader = this.page.locator(`#nmr-table thead th`).filter({ hasText: `J${jIndex + 1}` });
    const count = await jHeader.count();
    if (count === 0) return false;

    const display = await jHeader.evaluate((el) => window.getComputedStyle(el).display);
    return display !== 'none';
  }

  /**
   * Click "Generate Text" button
   */
  async generateText(): Promise<void> {
    await this.generateTextBtn.click();
  }

  /**
   * Check if a J-input is disabled
   */
  async isJInputDisabled(rowIndex: number, jIndex: number): Promise<boolean> {
    const jInput = this.getJInput(rowIndex, jIndex);
    return await jInput.isDisabled();
  }

  /**
   * Check if a J-input is greyed out (has disabled styling)
   */
  async isJInputGreyedOut(rowIndex: number, jIndex: number): Promise<boolean> {
    const jInput = this.getJInput(rowIndex, jIndex);
    const parentCell = jInput.locator('..');

    // Check if parent cell is displayed
    const display = await parentCell.evaluate((el) => window.getComputedStyle(el).display);
    if (display === 'none') return false;

    // Check if input is disabled
    const isDisabled = await jInput.isDisabled();
    if (!isDisabled) return false;

    // Check visual styling (opacity or color)
    const opacity = await jInput.evaluate((el) => window.getComputedStyle(el).opacity);
    const color = await jInput.evaluate((el) => window.getComputedStyle(el).color);

    // Consider greyed out if opacity < 1 or color is grey-ish
    return parseFloat(opacity) < 1 || color.includes('128') || color.includes('gray') || color.includes('grey');
  }

  /**
   * Check if an input has error styling
   */
  async hasError(input: Locator): Promise<boolean> {
    const className = await input.getAttribute('class');
    return className?.includes('error') || false;
  }

  /**
   * Check if assignment field is showing placeholder
   */
  async isAssignmentPlaceholderVisible(rowIndex: number): Promise<boolean> {
    const assignment = this.getAssignmentInput(rowIndex);
    const content = await assignment.textContent();
    const innerHTML = await assignment.innerHTML();
    return (content === '' || content === null) && (innerHTML === '' || innerHTML === '<br>');
  }

  /**
   * Get assignment field inner HTML
   */
  async getAssignmentHTML(rowIndex: number): Promise<string> {
    return await this.getAssignmentInput(rowIndex).innerHTML();
  }

  /**
   * Get assignment field text content
   */
  async getAssignmentText(rowIndex: number): Promise<string> {
    return await this.getAssignmentInput(rowIndex).textContent() || '';
  }

  /**
   * Apply formatting to a field (works with contenteditable fields)
   */
  async applyFormatting(input: Locator, format: 'bold' | 'italic' | 'sub' | 'sup' | 'endash'): Promise<void> {
    // Focus the input first
    await input.focus();

    // Click the appropriate toolbar button
    switch (format) {
      case 'bold':
        await this.boldBtn.click();
        break;
      case 'italic':
        await this.italicBtn.click();
        break;
      case 'sub':
        await this.subBtn.click();
        break;
      case 'sup':
        await this.supBtn.click();
        break;
      case 'endash':
        await this.endashBtn.click();
        break;
    }
  }

  /**
   * Apply formatting via keyboard shortcut
   */
  async applyFormattingShortcut(input: Locator, shortcut: 'bold' | 'italic'): Promise<void> {
    await input.focus();

    if (shortcut === 'bold') {
      await input.press('Control+b');
    } else if (shortcut === 'italic') {
      await input.press('Control+i');
    }
  }

  /**
   * Clear an input field (works for both text input and contenteditable)
   */
  async clearInput(input: Locator): Promise<void> {
    await input.click();
    await input.press('Control+A');
    await input.press('Backspace');
  }

  /**
   * Get the value of a text input field
   */
  async getInputValue(input: Locator): Promise<string> {
    return await input.inputValue();
  }

  /**
   * Check if a J-cell is visible (not display:none)
   */
  async isJCellVisible(rowIndex: number, jIndex: number): Promise<boolean> {
    const jInput = this.getJInput(rowIndex, jIndex);
    const parentCell = jInput.locator('..');
    const display = await parentCell.evaluate((el) => window.getComputedStyle(el).display);
    return display !== 'none';
  }
}
