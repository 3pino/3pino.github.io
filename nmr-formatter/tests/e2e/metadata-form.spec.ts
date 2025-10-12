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

    test('should reject decimal points in all numeric fields', async () => {
      // Test frequency field
      await helper.clearField(helper.frequency);
      await helper.frequency.type('123.456');
      let content = await helper.getTextContent(helper.frequency);
      expect(content).toBe('123456'); // Decimal point removed

      // Test shift-precision field  
      await helper.clearField(helper.shiftPrecision);
      await helper.shiftPrecision.type('5.5');
      content = await helper.getTextContent(helper.shiftPrecision);
      expect(content).toBe('55'); // Decimal point removed

      // Test j-precision field
      await helper.clearField(helper.jPrecision);
      await helper.jPrecision.type('2.1');
      content = await helper.getTextContent(helper.jPrecision);
      expect(content).toBe('21'); // Decimal point removed
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


  test.describe('Dropdown Selection', () => {
    test('nuclei: should be able to select from dropdown', async () => {
      const field = helper.nuclei;
      
      // Clear and focus field to show dropdown
      await helper.clearField(field);
      await field.click();
      
      // Wait for dropdown to appear
      const dropdown = helper.page.locator('#nuclei-dropdown');
      await expect(dropdown).toHaveClass(/active/);
      
      // Click on a dropdown item (13C)
      const item = dropdown.locator('.dropdown-item').filter({ hasText: '13C' }).first();
      await item.click();
      
      // Check that value was set
      const html = await helper.getInnerHTML(field);
      expect(html).toContain('<sup>13</sup>C');
    });

    test('solvent: should be able to select from dropdown', async () => {
      const field = helper.solvent;
      
      await helper.clearField(field);
      await field.click();
      
      const dropdown = helper.page.locator('#solvent-dropdown');
      await expect(dropdown).toHaveClass(/active/);
      
      // Click on DMSO
      const item = dropdown.locator('.dropdown-item').filter({ hasText: 'DMSO' }).first();
      await item.click();
      
      const html = await helper.getInnerHTML(field);
      expect(html).toContain('DMSO');
    });

    test('sort-order: should toggle between Descending and Ascending', async () => {
      const button = helper.sortOrder;

      // Check initial state (Descending - down arrow)
      let icon = button.locator('i');
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Click to toggle to Ascending
      await button.click();

      // Should now show up arrow
      await expect(icon).toHaveClass(/fi-rr-up/);

      // Click again to toggle back to Descending
      await button.click();

      // Should show down arrow again
      await expect(icon).toHaveClass(/fi-rr-down/);
    });

    test('sort-order: should not accept text input', async () => {
      const button = helper.sortOrder;

      // Focus the button
      await button.focus();

      // Check initial state
      let icon = button.locator('i');
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Try to type text - should be ignored
      await button.press('a');
      await button.press('b');
      await button.press('c');

      // Icon should remain unchanged (still down arrow)
      await expect(icon).toHaveClass(/fi-rr-down/);
    });

    test('sort-order: should toggle with Enter/Space and navigate with Tab', async () => {
      const button = helper.sortOrder;

      // Focus the button
      await button.focus();

      // Check initial state
      let icon = button.locator('i');
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Press Enter to toggle
      await button.press('Enter');

      // Should toggle to up arrow
      await expect(icon).toHaveClass(/fi-rr-up/);

      // Press Space to toggle back
      await button.press(' ');

      // Should toggle back to down arrow
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Tab should navigate to previous field (Shift+Tab navigates backward)
      await button.press('Shift+Tab');
      await expect(helper.jPrecision).toBeFocused();
    });
  });

  test.describe('Sort-Order Toggle Button Behavior', () => {
    test('sort-order should be focusable and toggle on click', async () => {
      const button = helper.sortOrder;

      // Click on sort-order button
      await button.click();
      await expect(button).toBeFocused();

      // Icon should toggle to up arrow (Ascending)
      const icon = button.locator('i');
      await expect(icon).toHaveClass(/fi-rr-up/);

      // Click again to toggle back
      await button.click();
      await expect(icon).toHaveClass(/fi-rr-down/);
    });

    test('sort-order should ignore text input attempts', async () => {
      const button = helper.sortOrder;

      // Focus the button
      await button.focus();

      // Initial state should be down arrow
      const icon = button.locator('i');
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Try typing - should be ignored (button doesn't accept text)
      await button.press('a');
      await button.press('b');
      await button.press('c');

      // Icon should remain unchanged
      await expect(icon).toHaveClass(/fi-rr-down/);
    });

    test('sort-order should focus with Tab and toggle with keyboard', async () => {
      // Tab to sort-order from j-precision
      await helper.jPrecision.click();
      await helper.jPrecision.press('Tab');

      await expect(helper.sortOrder).toBeFocused();

      // Check initial state
      const icon = helper.sortOrder.locator('i');
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Press Enter to toggle
      await helper.sortOrder.press('Enter');

      // Should toggle to up arrow
      await expect(icon).toHaveClass(/fi-rr-up/);
    });

    test('sort-order should change via click or keyboard interaction', async () => {
      const button = helper.sortOrder;
      const icon = button.locator('i');

      // Initial state: down arrow (Descending)
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Click to toggle
      await button.click();

      // Should change to up arrow (Ascending)
      await expect(icon).toHaveClass(/fi-rr-up/);

      // Use keyboard (Space) to toggle back
      await button.press(' ');

      // Should change back to down arrow (Descending)
      await expect(icon).toHaveClass(/fi-rr-down/);
    });
  });
});

