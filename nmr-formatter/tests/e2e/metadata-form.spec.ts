import { test, expect } from '@playwright/test';
import { MetadataFormHelper } from '../fixtures/test-helpers';

test.describe('Metadata Form - Input Validation', () => {
  let helper: MetadataFormHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MetadataFormHelper(page);
    await helper.goto();
  });

  test.describe('Numeric Field Validation (1-9 range)', () => {
    test('shift-precision: should accept valid numbers 1-9', async () => {
      const field = helper.shiftPrecision;

      // Test valid values
      for (let i = 1; i <= 9; i++) {
        await helper.clearField(field);
        await field.type(i.toString());

        const content = await helper.getTextContent(field);
        expect(content).toBe(i.toString());

        // Should not have error class for valid values
        const hasError = await helper.hasError(field);
        expect(hasError).toBe(false);
      }
    });



    test('shift-precision: should reject non-numeric characters', async () => {
      const field = helper.shiftPrecision;

      await helper.clearField(field);
      await field.type('abc123xyz');

      // Only first numeric character should remain (1-digit limit)
      const content = await helper.getTextContent(field);
      expect(content).toBe('1');
    });

    test('j-precision: should accept valid numbers 1-9', async () => {
      const field = helper.jPrecision;

      // Test valid values
      for (let i = 1; i <= 9; i++) {
        await helper.clearField(field);
        await field.type(i.toString());

        const content = await helper.getTextContent(field);
        expect(content).toBe(i.toString());

        const hasError = await helper.hasError(field);
        expect(hasError).toBe(false);
      }
    });



    test('j-precision: should reject non-numeric characters', async () => {
      const field = helper.jPrecision;

      await helper.clearField(field);
      await field.type('test5.5@#$');

      // Only first numeric character should remain (1-digit limit)
      const content = await helper.getTextContent(field);
      expect(content).toBe('5');
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

      // Test shift-precision field (1-digit limit: only first digit)
      await helper.clearField(helper.shiftPrecision);
      await helper.shiftPrecision.type('5.5');
      content = await helper.getTextContent(helper.shiftPrecision);
      expect(content).toBe('5'); // Decimal point removed, only first digit kept

      // Test j-precision field (1-digit limit: only first digit)
      await helper.clearField(helper.jPrecision);
      await helper.jPrecision.type('2.1');
      content = await helper.getTextContent(helper.jPrecision);
      expect(content).toBe('2'); // Decimal point removed, only first digit kept
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

  test.describe('Empty Field Validation', () => {
    test('should show error when required fields are empty on Generate Text', async () => {
      // Clear all fields to make them empty
      await helper.clearField(helper.nuclei);
      await helper.clearField(helper.solvent);
      await helper.clearField(helper.frequency);
      await helper.clearField(helper.shiftPrecision);
      await helper.clearField(helper.jPrecision);

      // Blur to trigger cleanup
      await helper.nuclei.blur();
      await helper.solvent.blur();
      await helper.frequency.blur();
      await helper.shiftPrecision.blur();
      await helper.jPrecision.blur();

      // Click Generate Text button
      const generateBtn = helper.page.locator('#convert-down-btn');
      await generateBtn.click();

      // All fields should show error
      expect(await helper.hasError(helper.nuclei)).toBe(true);
      expect(await helper.hasError(helper.solvent)).toBe(true);
      expect(await helper.hasError(helper.frequency)).toBe(true);
      expect(await helper.hasError(helper.shiftPrecision)).toBe(true);
      expect(await helper.hasError(helper.jPrecision)).toBe(true);
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

  test.describe('Keyboard Shortcuts (Ctrl+B/I)', () => {
    test('nuclei: should support Ctrl+B for bold formatting', async () => {
      const field = helper.nuclei;

      await helper.clearField(field);
      await field.click();
      await field.type('Test');

      // Select all and apply bold
      await field.press('Control+A');
      await field.press('Control+B');

      const html = await helper.getInnerHTML(field);
      expect(html).toContain('<b>Test</b>');
    });

    test('solvent: should support Ctrl+I for italic formatting', async () => {
      const field = helper.solvent;

      await helper.clearField(field);
      await field.click();
      await field.type('DMSO');

      // Select all and apply italic
      await field.press('Control+A');
      await field.press('Control+I');

      const html = await helper.getInnerHTML(field);
      expect(html).toContain('<i>DMSO</i>');
    });

    test('frequency: should NOT support Ctrl+B (numeric field with inputFilter)', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.type('500');

      await field.press('Control+A');
      await field.press('Control+B');

      // Should remain plain text (no <b> tag)
      const html = await helper.getInnerHTML(field);
      expect(html).not.toContain('<b>');
      expect(await helper.getTextContent(field)).toBe('500');
    });

    test('shift-precision: should NOT support Ctrl+I (numeric field with inputFilter)', async () => {
      const field = helper.shiftPrecision;

      await helper.clearField(field);
      await field.type('2');

      await field.press('Control+A');
      await field.press('Control+I');

      const html = await helper.getInnerHTML(field);
      expect(html).not.toContain('<i>');
      expect(await helper.getTextContent(field)).toBe('2');
    });

    test('j-precision: should NOT support Ctrl+B (numeric field with inputFilter)', async () => {
      const field = helper.jPrecision;

      await helper.clearField(field);
      await field.type('3');

      await field.press('Control+A');
      await field.press('Control+B');

      const html = await helper.getInnerHTML(field);
      expect(html).not.toContain('<b>');
      expect(await helper.getTextContent(field)).toBe('3');
    });
  });

  test.describe('Paste Filtering', () => {
    test('frequency: should filter non-numeric characters on paste', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.click();

      // Simulate paste with clipboard data containing non-numeric characters
      await field.evaluate((el) => {
        const dt = new DataTransfer();
        dt.setData('text/plain', '500MHz');
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(pasteEvent);
      });

      // Wait for paste to be processed
      await helper.page.waitForTimeout(100);

      const content = await helper.getTextContent(field);
      expect(content).toBe('500'); // 'MHz' should be filtered out
    });

    test('shift-precision: should extract only valid digits on paste', async () => {
      const field = helper.shiftPrecision;

      await helper.clearField(field);
      await field.click();

      await field.evaluate((el) => {
        const dt = new DataTransfer();
        dt.setData('text/plain', 'abc5def');
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(pasteEvent);
      });

      await helper.page.waitForTimeout(100);

      const content = await helper.getTextContent(field);
      expect(content).toBe('5'); // Only digit 5 should remain
    });

    test('j-precision: should extract only first valid digit on paste', async () => {
      const field = helper.jPrecision;

      await helper.clearField(field);
      await field.click();

      await field.evaluate((el) => {
        const dt = new DataTransfer();
        dt.setData('text/plain', '2.5Hz');
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(pasteEvent);
      });

      await helper.page.waitForTimeout(100);

      const content = await helper.getTextContent(field);
      expect(content).toBe('2'); // Extract only first digit '2', filter '.5Hz'
    });

    test('nuclei: should preserve HTML formatting on paste', async () => {
      const field = helper.nuclei;

      await helper.clearField(field);
      await field.click();

      await field.evaluate((el) => {
        const dt = new DataTransfer();
        dt.setData('text/html', '<sup>13</sup>C');
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(pasteEvent);
      });

      await helper.page.waitForTimeout(100);

      const html = await helper.getInnerHTML(field);
      expect(html).toContain('<sup>13</sup>');
      expect(html).toContain('C');
    });

    test('solvent: should filter disallowed HTML tags on paste', async () => {
      const field = helper.solvent;

      await helper.clearField(field);
      await field.click();

      await field.evaluate((el) => {
        const dt = new DataTransfer();
        dt.setData('text/html', '<strong>CDCl</strong><sub>3</sub>');
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(pasteEvent);
      });

      await helper.page.waitForTimeout(100);

      const html = await helper.getInnerHTML(field);
      // <strong> should be filtered, <sub> should be preserved
      expect(html).not.toContain('<strong>');
      expect(html).toContain('<sub>3</sub>');
    });
  });

  test.describe('Multi-digit Numeric Input', () => {
    test('frequency: should accept multi-digit numbers', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.type('500');

      let content = await helper.getTextContent(field);
      expect(content).toBe('500');

      // Should be able to add more digits
      await field.type('0');
      content = await helper.getTextContent(field);
      expect(content).toBe('5000');
    });

    test('frequency: should handle typing zero after other digits', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.type('5');

      let content = await helper.getTextContent(field);
      expect(content).toBe('5');

      // Type '0' - should be accepted
      await field.type('0');
      content = await helper.getTextContent(field);
      expect(content).toBe('50');

      // Type another '0'
      await field.type('0');
      content = await helper.getTextContent(field);
      expect(content).toBe('500');
    });

    test('frequency: should reject leading zeros (pattern /[1-9]\\d*/)', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.type('007');

      const content = await helper.getTextContent(field);
      // Pattern /[1-9]\d*/ requires first digit to be 1-9, so '007' -> '7'
      expect(content).toBe('7');
    });

    test('frequency: should accept very large numbers', async () => {
      const field = helper.frequency;

      await helper.clearField(field);
      await field.type('123456789');

      const content = await helper.getTextContent(field);
      expect(content).toBe('123456789');
    });

    test('shift-precision: should only keep first digit with /[1-9]/ pattern', async () => {
      const field = helper.shiftPrecision;

      await helper.clearField(field);
      await field.type('5');

      let content = await helper.getTextContent(field);
      expect(content).toBe('5');

      // Try to add another digit - should keep only the first digit
      await field.type('7');
      content = await helper.getTextContent(field);
      // Only first digit should remain (1-digit limit)
      expect(content).toBe('5');
    });

    test('j-precision: should only keep first digit from input', async () => {
      const field = helper.jPrecision;

      await helper.clearField(field);
      await field.type('3');

      let content = await helper.getTextContent(field);
      expect(content).toBe('3');

      // Try to add another digit - should keep only the first digit
      await field.type('9');
      content = await helper.getTextContent(field);
      expect(content).toBe('3');
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

