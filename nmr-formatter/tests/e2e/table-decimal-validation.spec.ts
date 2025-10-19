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
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      await helper.fillInput(jInput, '7.5');

      const value = await helper.getInputValue(jInput);
      expect(value).toBe('7.5');
    });

    test('should reject multiple decimal points', async () => {
      // Set up J-column
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      // Try to type multiple decimal points
      await helper.typeIntoInput(jInput, '7.5.3');

      const value = await helper.getInputValue(jInput);
      // Should only have one decimal point: "7.53"
      expect(value).toBe('7.53');
      expect(value.split('.').length - 1).toBe(1); // Count decimal points
    });

    test('should handle decimal point in various positions', async () => {
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      // Decimal at start
      await helper.fillInput(jInput, '.5');
      expect(await helper.getInputValue(jInput)).toBe('.5');

      // Decimal in middle
      await helper.fillInput(jInput, '7.53');
      expect(await helper.getInputValue(jInput)).toBe('7.53');

      // Decimal at end
      await helper.fillInput(jInput, '7.');
      expect(await helper.getInputValue(jInput)).toBe('7.');
    });

    test('should prevent third decimal point when typing', async () => {
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      // Type incrementally
      await helper.typeIntoInput(jInput, '1');
      expect(await helper.getInputValue(jInput)).toBe('1');

      await helper.typeIntoInput(jInput, '.');
      expect(await helper.getInputValue(jInput)).toBe('1.');

      await helper.typeIntoInput(jInput, '2');
      expect(await helper.getInputValue(jInput)).toBe('1.2');

      await helper.typeIntoInput(jInput, '.');
      // Second decimal point should be removed
      expect(await helper.getInputValue(jInput)).toBe('1.2');

      await helper.typeIntoInput(jInput, '3');
      expect(await helper.getInputValue(jInput)).toBe('1.23');
    });

    test('should handle paste with multiple decimal points', async () => {
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      // Simulate paste by filling with invalid value
      await helper.fillInput(jInput, '7.5.3.1');

      const value = await helper.getInputValue(jInput);
      // Should collapse to single decimal point
      expect(value).toBe('7.531');
      expect(value.split('.').length - 1).toBe(1);
    });

    test('should allow only numbers and one decimal point', async () => {
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      await helper.fillInput(jInput, '7.5abc3.2def');

      const value = await helper.getInputValue(jInput);
      // Should filter out letters and extra decimal points
      expect(value).toBe('7.532');
      expect(value).toMatch(/^[0-9]*\.?[0-9]*$/);
    });
  });

  test.describe('Integration Input - Single Decimal Point', () => {
    test('should accept single decimal point', async () => {
      const intInput = helper.getIntegrationInput(0);

      await helper.fillInput(intInput, '3.5');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.5');
    });

    test('should reject multiple decimal points', async () => {
      const intInput = helper.getIntegrationInput(0);

      await helper.typeIntoInput(intInput, '3.5.2');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.52');
      expect(value.split('.').length - 1).toBe(1);
    });

    test('should handle decimal point in various positions', async () => {
      const intInput = helper.getIntegrationInput(0);

      // Decimal at start
      await helper.fillInput(intInput, '.5');
      expect(await helper.getInputValue(intInput)).toBe('.5');

      // Decimal in middle
      await helper.fillInput(intInput, '3.5');
      expect(await helper.getInputValue(intInput)).toBe('3.5');

      // Decimal at end
      await helper.fillInput(intInput, '3.');
      expect(await helper.getInputValue(intInput)).toBe('3.');
    });

    test('should prevent additional decimal points when typing', async () => {
      const intInput = helper.getIntegrationInput(0);

      await helper.typeIntoInput(intInput, '2');
      expect(await helper.getInputValue(intInput)).toBe('2');

      await helper.typeIntoInput(intInput, '.');
      expect(await helper.getInputValue(intInput)).toBe('2.');

      await helper.typeIntoInput(intInput, '5');
      expect(await helper.getInputValue(intInput)).toBe('2.5');

      await helper.typeIntoInput(intInput, '.');
      // Should not add another decimal point
      expect(await helper.getInputValue(intInput)).toBe('2.5');

      await helper.typeIntoInput(intInput, '7');
      expect(await helper.getInputValue(intInput)).toBe('2.57');
    });

    test('should handle paste with multiple decimal points', async () => {
      const intInput = helper.getIntegrationInput(0);

      await helper.fillInput(intInput, '3.5.2.1');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.521');
      expect(value.split('.').length - 1).toBe(1);
    });

    test('should allow only numbers and one decimal point', async () => {
      const intInput = helper.getIntegrationInput(0);

      await helper.fillInput(intInput, '3.5test2.1xyz');

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3.521');
      expect(value).toMatch(/^[0-9]*\.?[0-9]*$/);
    });
  });

  test.describe('Chemical Shift Input - Range and Negative Values', () => {
    test('should accept single positive value', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, '7.25');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.25');
    });

    test('should accept negative value', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, '-1.5');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('-1.5');
    });

    test('should accept range with hyphen', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, '7.25-7.30');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.25-7.30');
    });

    test('should accept range with en dash', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, '7.25–7.30');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.25–7.30');
    });

    test('should filter out invalid characters', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, '7.25abc-7.30xyz');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.25-7.30');
      expect(value).toMatch(/^[0-9.\-–]+$/);
    });

    test('should allow only valid characters [0-9.-–]', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, 'test7.25@#$-7.30!');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.25-7.30');
      expect(value).toMatch(/^[0-9.\-–]+$/);
    });

    test('should handle negative range', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, '-2.5--1.0');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('-2.5--1.0');
    });

    test('should accept multiple decimal points in range values', async () => {
      const shiftInput = helper.getShiftInput(0);

      await helper.fillInput(shiftInput, '1.23-4.56');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('1.23-4.56');
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle only decimal points (no numbers)', async () => {
      const intInput = helper.getIntegrationInput(0);

      await helper.fillInput(intInput, '...');

      const value = await helper.getInputValue(intInput);
      // Should result in empty or single decimal
      expect(value).toMatch(/^\.?$/);
    });

    test('should handle consecutive decimal point attempts', async () => {
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      await helper.typeIntoInput(jInput, '7');
      await helper.typeIntoInput(jInput, '.');
      await helper.typeIntoInput(jInput, '.');
      await helper.typeIntoInput(jInput, '.');
      await helper.typeIntoInput(jInput, '5');

      const value = await helper.getInputValue(jInput);
      expect(value).toBe('7.5');
    });

    test('should preserve existing decimal when trying to add another', async () => {
      const intInput = helper.getIntegrationInput(0);

      // Start with valid value
      await helper.fillInput(intInput, '1.23');

      // Try to insert another decimal in middle
      await intInput.click();
      await intInput.press('Home');
      await intInput.press('ArrowRight'); // After '1'
      await helper.typeIntoInput(intInput, '.');

      const value = await helper.getInputValue(intInput);
      // Should not have added the decimal, or should have handled it gracefully
      const decimalCount = (value.match(/\./g) || []).length;
      expect(decimalCount).toBeLessThanOrEqual(1);
    });

    test('should work correctly after clearing and re-entering', async () => {
      await helper.fillInput(helper.getMultiplicityInput(0), 'd');
      
      // Wait for J-column to become visible and editable
      const jInput = helper.getJInput(0, 0);
      await jInput.waitFor({ state: 'visible' });
      await helper.page.waitForTimeout(100);

      // First entry
      await helper.fillInput(jInput, '7.5');
      expect(await helper.getInputValue(jInput)).toBe('7.5');

      // Clear
      await helper.clearInput(jInput);

      // Second entry with multiple decimals
      await helper.typeIntoInput(jInput, '3.2.1');
      expect(await helper.getInputValue(jInput)).toBe('3.21');
    });
  });
});
