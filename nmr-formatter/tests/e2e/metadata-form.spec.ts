import { test, expect } from '@playwright/test';
import { MetadataFormHelper } from '../fixtures/test-helpers';

test.describe('Metadata Form - Input Validation', () => {
  let helper: MetadataFormHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MetadataFormHelper(page);
    await helper.goto();
  });

  test.describe('Numeric Field Validation (1-10 range)', () => {
    test('shift-precision: should accept valid numbers 1-10', async () => {
      const field = helper.shiftPrecision;

      // Test valid values
      for (let i = 1; i <= 10; i++) {
        await helper.clearField(field);
        await field.type(i.toString());

        const content = await helper.getTextContent(field);
        expect(content).toBe(i.toString());

        // Should not have error class for valid values
        const hasError = await helper.hasError(field);
        expect(hasError).toBe(false);
      }
    });

    test('shift-precision: should reject values outside 1-10 range', async () => {
      const field = helper.shiftPrecision;

      // Test out-of-range values (should show error)
      const invalidValues = [0, 11, 15, 100];

      for (const value of invalidValues) {
        await helper.clearField(field);
        await field.type(value.toString());

        const content = await helper.getTextContent(field);
        expect(content).toBe(value.toString());

        // Should have error class for invalid values
        const hasError = await helper.hasError(field);
        expect(hasError).toBe(true);
      }
    });

    test('shift-precision: should reject non-numeric characters', async () => {
      const field = helper.shiftPrecision;

      await helper.clearField(field);
      await field.type('abc123xyz');

      // Only numeric characters should remain
      const content = await helper.getTextContent(field);
      expect(content).toBe('123');
    });

    test('j-precision: should accept valid numbers 1-10', async () => {
      const field = helper.jPrecision;

      // Test valid values
      for (let i = 1; i <= 10; i++) {
        await helper.clearField(field);
        await field.type(i.toString());

        const content = await helper.getTextContent(field);
        expect(content).toBe(i.toString());

        const hasError = await helper.hasError(field);
        expect(hasError).toBe(false);
      }
    });

    test('j-precision: should reject values outside 1-10 range', async () => {
      const field = helper.jPrecision;

      const invalidValues = [0, 11, 20, 99];

      for (const value of invalidValues) {
        await helper.clearField(field);
        await field.type(value.toString());

        const content = await helper.getTextContent(field);
        expect(content).toBe(value.toString());

        const hasError = await helper.hasError(field);
        expect(hasError).toBe(true);
      }
    });

    test('j-precision: should reject non-numeric characters', async () => {
      const field = helper.jPrecision;

      await helper.clearField(field);
      await field.type('test5.5@#$');

      // Only numeric characters should remain
      const content = await helper.getTextContent(field);
      expect(content).toBe('55');
    });

    test('frequency: should accept any positive number', async () => {
      const field = helper.frequency;

      const validValues = ['100', '500', '1000', '123456'];

      for (const value of validValues) {
        await helper.clearField(field);
        await field.type(value);

        const content = await helper.getTextContent(field);
        expect(content).toBe(value);

        // Frequency has no upper limit, so no error
        const hasError = await helper.hasError(field);
        expect(hasError).toBe(false);
      }
    });

    test('frequency: should reject non-numeric characters', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.type('500MHz');

      // Only numeric characters should remain
      const content = await helper.getTextContent(field);
      expect(content).toBe('500');
    });
  });

  test.describe('Text Deletion Behavior', () => {
    test('nuclei: should show placeholder when all text is deleted', async () => {
      const field = helper.nuclei;

      // Clear default value first
      await helper.clearField(field);

      // Type some text
      await field.click();
      await field.type('¹H');

      // Verify text exists
      let content = await helper.getTextContent(field);
      expect(content).toBe('¹H');

      // Delete all text with backspace
      await field.press('Control+A');
      await field.press('Backspace');

      // Blur to trigger placeholder logic
      await field.blur();

      // Check placeholder is visible
      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);
    });

    test('solvent: should show placeholder when all text is deleted', async () => {
      const field = helper.solvent;

      // Clear default value first
      await helper.clearField(field);

      await field.click();
      await field.type('CDCl₃');

      let content = await helper.getTextContent(field);
      expect(content).toBe('CDCl₃');

      // Delete all text
      await field.press('Control+A');
      await field.press('Backspace');
      await field.blur();

      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);
    });

    test('frequency: should show placeholder when all text is deleted', async () => {
      const field = helper.frequency;

      await field.click();
      await field.type('500');

      let content = await helper.getTextContent(field);
      expect(content).toBe('500');

      // Delete all text
      await field.press('Control+A');
      await field.press('Backspace');
      await field.blur();

      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);
    });

    test('should delete text character by character with backspace', async () => {
      const field = helper.nuclei;

      // Clear default value first
      await helper.clearField(field);

      await field.click();
      await field.type('Test');

      // Delete one character at a time
      await field.press('Backspace');
      expect(await helper.getTextContent(field)).toBe('Tes');

      await field.press('Backspace');
      expect(await helper.getTextContent(field)).toBe('Te');

      await field.press('Backspace');
      expect(await helper.getTextContent(field)).toBe('T');

      await field.press('Backspace');
      await field.blur();

      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);
    });
  });

  test.describe('Empty Tag Cleanup', () => {
    test('nuclei: should cleanup empty HTML tags and show placeholder', async () => {
      const field = helper.nuclei;

      // Clear default value first
      await helper.clearField(field);

      // Manually insert HTML with empty tags
      await field.click();
      await field.evaluate((el) => {
        el.innerHTML = '<sup></sup><sub></sub><b></b>';
      });

      // Blur should trigger cleanup
      await field.blur();

      // Empty tags should be removed
      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);
    });

    test('solvent: should cleanup empty tags with whitespace', async () => {
      const field = helper.solvent;

      // Clear default value first
      await helper.clearField(field);

      await field.click();
      await field.evaluate((el) => {
        el.innerHTML = '<sub> </sub><sup>  </sup>';
      });

      await field.blur();

      // Whitespace-only tags should be removed
      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);
    });

    test('nuclei: should preserve tags with content', async () => {
      const field = helper.nuclei;

      // Clear default value first
      await helper.clearField(field);

      await field.click();
      await field.evaluate((el) => {
        el.innerHTML = '<sup>1</sup>H';
      });

      await field.blur();

      const html = await helper.getInnerHTML(field);
      expect(html).toContain('<sup>1</sup>H');

      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(false);
    });
  });

  test.describe('No Response on Empty Field Key Press', () => {
    test('should not error when pressing backspace on empty field', async () => {
      const field = helper.nuclei;

      // Ensure field is empty
      await helper.clearField(field);
      await field.blur();
      await field.click();

      // Verify it's empty
      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);

      // Press backspace multiple times
      await field.press('Backspace');
      await field.press('Backspace');
      await field.press('Backspace');

      // Should still be empty, no errors
      const stillEmpty = await helper.isPlaceholderVisible(field);
      expect(stillEmpty).toBe(true);

      const hasError = await helper.hasError(field);
      expect(hasError).toBe(false);
    });

    test('should not error when pressing delete on empty field', async () => {
      const field = helper.solvent;

      await helper.clearField(field);
      await field.blur();
      await field.click();

      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);

      // Press delete multiple times
      await field.press('Delete');
      await field.press('Delete');
      await field.press('Delete');

      const stillEmpty = await helper.isPlaceholderVisible(field);
      expect(stillEmpty).toBe(true);

      const hasError = await helper.hasError(field);
      expect(hasError).toBe(false);
    });

    test('numeric field: should not error on backspace when empty', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.blur();
      await field.click();

      // Press backspace on empty numeric field
      await field.press('Backspace');
      await field.press('Backspace');

      const isPlaceholder = await helper.isPlaceholderVisible(field);
      expect(isPlaceholder).toBe(true);

      const hasError = await helper.hasError(field);
      expect(hasError).toBe(false);
    });
  });

  test.describe('Keyboard Navigation - Enter and Shift+Enter', () => {
    test('Enter key should move to next field', async () => {
      // Start at nuclei
      await helper.nuclei.click();
      await helper.nuclei.press('Enter');

      // Should move to solvent
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Enter');

      // Should move to frequency
      await expect(helper.frequency).toBeFocused();

      await helper.frequency.press('Enter');

      // Should move to shift-precision
      await expect(helper.shiftPrecision).toBeFocused();

      await helper.shiftPrecision.press('Enter');

      // Should move to j-precision
      await expect(helper.jPrecision).toBeFocused();

      await helper.jPrecision.press('Enter');

      // Should move to sort-order
      await expect(helper.sortOrder).toBeFocused();
    });

    test('Shift+Enter should move to previous field', async () => {
      // Start at j-precision (last contenteditable field)
      // Note: sort-order is a select element and doesn't handle Shift+Enter
      await helper.jPrecision.click();
      await helper.jPrecision.press('Shift+Enter');

      // Should move to shift-precision
      await expect(helper.shiftPrecision).toBeFocused();

      await helper.shiftPrecision.press('Shift+Enter');

      // Should move to frequency
      await expect(helper.frequency).toBeFocused();

      await helper.frequency.press('Shift+Enter');

      // Should move to solvent
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Shift+Enter');

      // Should move to nuclei
      await expect(helper.nuclei).toBeFocused();
    });

    test('Enter should not create newline in contenteditable fields', async () => {
      const field = helper.nuclei;

      // Clear default value first
      await helper.clearField(field);

      await field.click();
      await field.type('Test');
      await field.press('Enter');

      // Should have moved focus away, not added newline
      await expect(field).not.toBeFocused();

      // Content should not contain <br> or newline
      const html = await helper.getInnerHTML(field);
      // Playwright's type() may wrap text in <span>, but no <br> should exist
      expect(html).not.toContain('<br>');
      expect(html).not.toContain('\n');
      
      // Text content should be preserved
      const text = await helper.getTextContent(field);
      expect(text).toBe('Test');
    });

    test('Enter and Shift+Enter should work with numeric fields', async () => {
      const field = helper.frequency;

      await field.click();
      await field.type('500');

      // Enter should move to next field
      await field.press('Enter');
      await expect(helper.shiftPrecision).toBeFocused();

      // Shift+Enter should move back
      await helper.shiftPrecision.press('Shift+Enter');
      await expect(field).toBeFocused();

      // Content should be preserved
      const content = await helper.getTextContent(field);
      expect(content).toBe('500');
    });

    test('Tab key should also navigate forward through fields', async () => {
      await helper.nuclei.click();
      await helper.nuclei.press('Tab');

      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Tab');
      await expect(helper.frequency).toBeFocused();

      await helper.frequency.press('Tab');
      await expect(helper.shiftPrecision).toBeFocused();
    });

    test('Shift+Tab should navigate backward through fields', async () => {
      // Start from j-precision instead of sort-order
      await helper.jPrecision.click();
      await helper.jPrecision.press('Shift+Tab');

      await expect(helper.shiftPrecision).toBeFocused();

      await helper.shiftPrecision.press('Shift+Tab');
      await expect(helper.frequency).toBeFocused();
    });
  });
});
