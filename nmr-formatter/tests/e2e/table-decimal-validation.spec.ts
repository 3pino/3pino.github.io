import { test, expect } from '@playwright/test';
import { TableHelper } from '../fixtures/test-helpers';

test.describe('Table Section - Decimal Point Validation', () => {
  let helper: TableHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TableHelper(page);
    await helper.goto();
  });

  test.describe('J-Value Input - Single Decimal Point', () => {
    test('should accept single decimal point', async () => {
      // Set up J-column
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      await jInput.fill('7.5');

      const value = await helper.getInputValue(jInput);
      expect(value).toBe('7.5');
    });

    test('should reject multiple decimal points', async () => {
      // Set up J-column
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      // Try to type multiple decimal points
      await jInput.click();
      await jInput.type('7.5.3');

      const value = await helper.getInputValue(jInput);
      // Should only have one decimal point: "7.53"
      expect(value).toBe('7.53');
      expect(value.split('.').length - 1).toBe(1); // Count decimal points
    });

    test('should handle decimal point in various positions', async () => {
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      // Decimal at start
      await jInput.fill('.5');
      expect(await helper.getInputValue(jInput)).toBe('.5');

      // Decimal in middle
      await jInput.fill('7.53');
      expect(await helper.getInputValue(jInput)).toBe('7.53');

      // Decimal at end
      await jInput.fill('7.');
      expect(await helper.getInputValue(jInput)).toBe('7.');
    });

    test('should prevent third decimal point when typing', async () => {
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      // Type incrementally
      await jInput.click();
      await jInput.type('1');
      expect(await helper.getInputValue(jInput)).toBe('1');

      await jInput.type('.');
      expect(await helper.getInputValue(jInput)).toBe('1.');

      await jInput.type('2');
      expect(await helper.getInputValue(jInput)).toBe('1.2');

      await jInput.type('.');
      // Second decimal point should be removed
      expect(await helper.getInputValue(jInput)).toBe('1.2');

      await jInput.type('3');
      expect(await helper.getInputValue(jInput)).toBe('1.23');
    });

    test('should handle paste with multiple decimal points', async () => {
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      // Simulate paste by filling with invalid value
      await jInput.fill('7.5.3.1');

      const value = await helper.getInputValue(jInput);
      // Should collapse to single decimal point
      expect(value).toBe('7.531');
      expect(value.split('.').length - 1).toBe(1);
    });

    test('should allow only numbers and one decimal point', async () => {
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      await jInput.fill('7.5abc3.2def');

      const value = await helper.getInputValue(jInput);
      // Should filter out letters and extra decimal points
      expect(value).toBe('7.532');
      expect(value).toMatch(/^[0-9]*\.?[0-9]*$/);
    });
  });

  test.describe('Integration Input - Single Decimal Point', () => {
    test('should accept single decimal point', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.fill('3.5');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.5');
    });

    test('should reject multiple decimal points', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.click();
      await intInput.type('3.5.2');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.52');
      expect(value.split('.').length - 1).toBe(1);
    });

    test('should handle decimal point in various positions', async () => {
      const intInput = helper.getIntegrationInput(0);

      // Decimal at start
      await intInput.fill('.5');
      expect(await helper.getInputValue(intInput)).toBe('.5');

      // Decimal in middle
      await intInput.fill('3.5');
      expect(await helper.getInputValue(intInput)).toBe('3.5');

      // Decimal at end
      await intInput.fill('3.');
      expect(await helper.getInputValue(intInput)).toBe('3.');
    });

    test('should prevent additional decimal points when typing', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.click();
      await intInput.type('2');
      expect(await helper.getInputValue(intInput)).toBe('2');

      await intInput.type('.');
      expect(await helper.getInputValue(intInput)).toBe('2.');

      await intInput.type('5');
      expect(await helper.getInputValue(intInput)).toBe('2.5');

      await intInput.type('.');
      // Should not add another decimal point
      expect(await helper.getInputValue(intInput)).toBe('2.5');

      await intInput.type('7');
      expect(await helper.getInputValue(intInput)).toBe('2.57');
    });

    test('should handle paste with multiple decimal points', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.fill('3.5.2.1');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.521');
      expect(value.split('.').length - 1).toBe(1);
    });

    test('should allow only numbers and one decimal point', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.fill('3.5test2.1xyz');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.521');
      expect(value).toMatch(/^[0-9]*\.?[0-9]*$/);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle only decimal points (no numbers)', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.fill('...');

      const value = await helper.getInputValue(intInput);
      // Should result in empty or single decimal
      expect(value).toMatch(/^\.?$/);
    });

    test('should handle consecutive decimal point attempts', async () => {
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      await jInput.click();
      await jInput.type('7');
      await jInput.type('.');
      await jInput.type('.');
      await jInput.type('.');
      await jInput.type('5');

      const value = await helper.getInputValue(jInput);
      expect(value).toBe('7.5');
    });

    test('should preserve existing decimal when trying to add another', async () => {
      const intInput = helper.getIntegrationInput(0);

      // Start with valid value
      await intInput.fill('1.23');

      // Try to insert another decimal in middle
      await intInput.click();
      await intInput.press('Home');
      await intInput.press('ArrowRight'); // After '1'
      await intInput.type('.');

      const value = await helper.getInputValue(intInput);
      // Should not have added the decimal, or should have handled it gracefully
      const decimalCount = (value.match(/\./g) || []).length;
      expect(decimalCount).toBeLessThanOrEqual(1);
    });

    test('should work correctly after clearing and re-entering', async () => {
      const jInput = helper.getJInput(0, 0);

      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      // First entry
      await jInput.fill('7.5');
      expect(await helper.getInputValue(jInput)).toBe('7.5');

      // Clear
      await helper.clearInput(jInput);

      // Second entry with multiple decimals
      await jInput.type('3.2.1');
      expect(await helper.getInputValue(jInput)).toBe('3.21');
    });
  });
});
