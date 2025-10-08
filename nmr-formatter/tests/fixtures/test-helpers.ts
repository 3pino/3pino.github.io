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
