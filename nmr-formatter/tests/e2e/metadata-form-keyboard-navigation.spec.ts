import { test, expect } from '@playwright/test';
import { MetadataFormHelper } from '../fixtures/test-helpers';

test.describe('Metadata Form - Keyboard Navigation', () => {
  let helper: MetadataFormHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MetadataFormHelper(page);
    await helper.goto();
  });

  test.describe('Dropdown Navigation with Up/Down Arrows', () => {
    test('nuclei dropdown: should navigate with ArrowDown key', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Press ArrowDown to highlight first item
      await field.press('ArrowDown');
      let highlighted = dropdown.locator('.dropdown-item.highlighted');
      await expect(highlighted).toHaveCount(1);

      // Press ArrowDown again to move to next item
      await field.press('ArrowDown');
      await expect(highlighted).toHaveCount(1);

      // Press Enter to select highlighted item
      await field.press('Enter');

      // Dropdown should close
      await expect(dropdown).not.toHaveClass(/active/);

      // Value should be updated
      const html = await helper.getInnerHTML(field);
      expect(html).not.toBe('');
    });

    test('nuclei dropdown: should navigate with ArrowUp key', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Press ArrowDown multiple times
      await field.press('ArrowDown');
      await field.press('ArrowDown');
      await field.press('ArrowDown');

      // Press ArrowUp to go back
      await field.press('ArrowUp');

      let highlighted = dropdown.locator('.dropdown-item.highlighted');
      await expect(highlighted).toHaveCount(1);

      // Press Enter to select
      await field.press('Enter');
      await expect(dropdown).not.toHaveClass(/active/);
    });

    test('nuclei dropdown: ArrowDown should not go beyond last item', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');
      const items = dropdown.locator('.dropdown-item');
      const itemCount = await items.count();

      // Press ArrowDown many times (more than item count)
      for (let i = 0; i < itemCount + 5; i++) {
        await field.press('ArrowDown');
      }

      // Should highlight last item
      const highlighted = dropdown.locator('.dropdown-item.highlighted');
      await expect(highlighted).toHaveCount(1);

      // Last item should be highlighted
      const lastItem = items.nth(itemCount - 1);
      await expect(lastItem).toHaveClass(/highlighted/);
    });

    test('nuclei dropdown: ArrowUp should not go above first item', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');

      // Press ArrowDown to select first item
      await field.press('ArrowDown');

      // Press ArrowUp multiple times
      await field.press('ArrowUp');
      await field.press('ArrowUp');
      await field.press('ArrowUp');

      // Should clear highlight (index -1)
      const highlighted = dropdown.locator('.dropdown-item.highlighted');
      await expect(highlighted).toHaveCount(0);
    });

    test('solvent dropdown: should navigate and select with arrow keys', async () => {
      const field = helper.solvent;
      await helper.clearField(field);
      await field.click();

      const dropdown = helper.page.locator('#solvent-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Navigate with arrow keys
      await field.press('ArrowDown');
      await field.press('ArrowDown');

      // Select with Enter
      await field.press('Enter');

      // Check value changed
      const html = await helper.getInnerHTML(field);
      expect(html).not.toBe('');
    });

    test('sort-order toggle button: should toggle state with Enter/Space', async () => {
      const button = helper.sortOrder;
      await button.click();

      // Initial state should be down arrow (Descending)
      const icon = button.locator('i');

      // After click, it should toggle to up arrow (Ascending)
      await expect(icon).toHaveClass(/fi-rr-up/);

      // Press Space to toggle back
      await button.press(' ');

      // Should toggle back to down arrow (Descending)
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Press Enter to toggle again
      await button.press('Enter');

      // Should toggle to up arrow (Ascending)
      await expect(icon).toHaveClass(/fi-rr-up/);
    });

    test('dropdown highlight should scroll into view', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');
      const items = dropdown.locator('.dropdown-item');
      const itemCount = await items.count();

      // Navigate to last item
      for (let i = 0; i < itemCount; i++) {
        await field.press('ArrowDown');
      }

      // Last item should be highlighted and visible
      const lastItem = items.nth(itemCount - 1);
      await expect(lastItem).toHaveClass(/highlighted/);
      await expect(lastItem).toBeInViewport();
    });

    test('Enter key in dropdown should only select, not navigate to next field', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Navigate with ArrowDown
      await field.press('ArrowDown');
      await field.press('ArrowDown');

      // Press Enter to select
      await field.press('Enter');

      // Dropdown should close
      await expect(dropdown).not.toHaveClass(/active/);

      // Should still be focused on nuclei (NOT moved to solvent)
      await expect(field).toBeFocused();

      // Value should be updated
      const html = await helper.getInnerHTML(field);
      expect(html).not.toBe('');
    });


    test('nuclei dropdown: Enter with highlighted item should NOT move focus to next field', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Navigate with ArrowDown
      await field.press('ArrowDown');
      await field.press('ArrowDown');

      // Press Enter to select
      await field.press('Enter');

      // Dropdown should close
      await expect(dropdown).not.toHaveClass(/active/);

      // Should still be focused on nuclei (NOT moved to solvent)
      await expect(field).toBeFocused();
    });

    test('solvent dropdown: Enter with highlighted item should NOT move focus to next field', async () => {
      const field = helper.solvent;
      await helper.clearField(field);
      await field.click();

      const dropdown = helper.page.locator('#solvent-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Navigate with ArrowDown
      await field.press('ArrowDown');
      await field.press('ArrowDown');

      // Press Enter to select
      await field.press('Enter');

      // Dropdown should close
      await expect(dropdown).not.toHaveClass(/active/);

      // Should still be focused on solvent (NOT moved to frequency)
      await expect(field).toBeFocused();
    });

    test('sort-order toggle button: Enter should toggle state and stay focused', async () => {
      const button = helper.sortOrder;
      await button.focus();

      // Check initial state
      const icon = button.locator('i');
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Press Enter to toggle
      await button.press('Enter');

      // Icon should toggle to up arrow
      await expect(icon).toHaveClass(/fi-rr-up/);

      // Should still be focused on sort-order (NOT moved away)
      await expect(button).toBeFocused();
    });

    test('nuclei dropdown: Enter without highlighted item should move to next field', async () => {
      const field = helper.nuclei;
      await field.click();

      const dropdown = helper.page.locator('#nuclei-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Don't highlight anything, just press Enter
      await field.press('Enter');

      // Should move to solvent
      await expect(helper.solvent).toBeFocused();
    });

    test('solvent dropdown: Enter without highlighted item should move to next field', async () => {
      const field = helper.solvent;
      await helper.clearField(field);
      await field.click();

      const dropdown = helper.page.locator('#solvent-dropdown');
      await expect(dropdown).toHaveClass(/active/);

      // Don't highlight anything, just press Enter
      await field.press('Enter');

      // Should move to frequency
      await expect(helper.frequency).toBeFocused();
    });

    test('sort-order toggle button: Enter should toggle and stay on last field', async () => {
      const button = helper.sortOrder;
      await button.focus();

      // Check initial state
      const icon = button.locator('i');
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Press Enter - should toggle icon
      await button.press('Enter');

      // Icon should toggle to up arrow
      await expect(icon).toHaveClass(/fi-rr-up/);

      // Should stay on sort-order (not move away - last field in group)
      await expect(button).toBeFocused();

      // Press Enter again - should toggle back
      await button.press('Enter');

      // Icon should toggle back to down arrow
      await expect(icon).toHaveClass(/fi-rr-down/);

      // Should still be focused on sort-order
      await expect(button).toBeFocused();
    });


  });

  test.describe('Smart Left/Right Arrow Navigation at Field Boundaries', () => {
    test('ArrowRight at end of nuclei field should move to solvent', async () => {
      const nuclei = helper.nuclei;
      const solvent = helper.solvent;

      // Clear and set value in nuclei
      await helper.clearField(nuclei);
      await nuclei.click();
      await nuclei.type('H');

      // Move cursor to end (should already be there)
      await nuclei.press('End');

      // Press ArrowRight
      await nuclei.press('ArrowRight');

      // Should move to solvent field
      await expect(solvent).toBeFocused();

      // Cursor should be at start of solvent
      const cursorPos = await solvent.evaluate((el) => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          return sel.getRangeAt(0).startOffset;
        }
        return -1;
      });
      expect(cursorPos).toBe(0);
    });

    test('ArrowLeft at start of solvent field should move to nuclei', async () => {
      const nuclei = helper.nuclei;
      const solvent = helper.solvent;

      // Clear and set value in solvent
      await helper.clearField(solvent);
      await solvent.click();
      await solvent.type('CDCl3');

      // Move cursor to start
      await solvent.press('Home');

      // Press ArrowLeft
      await solvent.press('ArrowLeft');

      // Should move to nuclei field
      await expect(nuclei).toBeFocused();

      // Cursor should be at end of nuclei
      const text = await helper.getTextContent(nuclei);
      const cursorPos = await nuclei.evaluate((el) => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(el);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          return preCaretRange.toString().length;
        }
        return -1;
      });
      expect(cursorPos).toBe(text.length);
    });

    test('ArrowRight at end of frequency field should NOT move to shift-precision (different group)', async () => {
      const frequency = helper.frequency;
      const shiftPrecision = helper.shiftPrecision;

      await frequency.click();
      await frequency.type('500');

      // Move to end
      await frequency.press('End');

      // Press ArrowRight
      await frequency.press('ArrowRight');

      // Should NOT move to shift-precision (different group)
      await expect(frequency).toBeFocused();
    });

    test('ArrowLeft at start of shift-precision should NOT move to frequency (different group)', async () => {
      const frequency = helper.frequency;
      const shiftPrecision = helper.shiftPrecision;

      await shiftPrecision.click();

      // Move to start
      await shiftPrecision.press('Home');

      // Press ArrowLeft
      await shiftPrecision.press('ArrowLeft');

      // Should NOT move to frequency (different group)
      await expect(shiftPrecision).toBeFocused();
    });

    test('ArrowRight in middle of text should NOT navigate to next field', async () => {
      const nuclei = helper.nuclei;

      await helper.clearField(nuclei);
      await nuclei.click();
      await nuclei.type('Test');

      // Move cursor to middle (position 2: "Te|st")
      await nuclei.press('Home');
      await nuclei.press('ArrowRight');
      await nuclei.press('ArrowRight');

      // Press ArrowRight
      await nuclei.press('ArrowRight');

      // Should still be in nuclei field
      await expect(nuclei).toBeFocused();
    });

    test('ArrowLeft in middle of text should NOT navigate to previous field', async () => {
      const solvent = helper.solvent;

      await helper.clearField(solvent);
      await solvent.click();
      await solvent.type('DMSO');

      // Move cursor to middle (position 2: "DM|SO")
      await solvent.press('Home');
      await solvent.press('ArrowRight');
      await solvent.press('ArrowRight');

      // Press ArrowLeft
      await solvent.press('ArrowLeft');

      // Should still be in solvent field
      await expect(solvent).toBeFocused();
    });

    test('ArrowRight with selection should NOT navigate to next field', async () => {
      const nuclei = helper.nuclei;

      await helper.clearField(nuclei);
      await nuclei.click();
      await nuclei.type('Test');

      // Select all text
      await nuclei.press('Control+A');

      // Press ArrowRight (should just move cursor to end of selection)
      await nuclei.press('ArrowRight');

      // Should still be in nuclei field
      await expect(nuclei).toBeFocused();
    });

    test('ArrowLeft with selection should NOT navigate to previous field', async () => {
      const solvent = helper.solvent;

      await helper.clearField(solvent);
      await solvent.click();
      await solvent.type('Test');

      // Select all text
      await solvent.press('Control+A');

      // Press ArrowLeft (should just move cursor to start of selection)
      await solvent.press('ArrowLeft');

      // Should still be in solvent field
      await expect(solvent).toBeFocused();
    });

    test('ArrowRight at last field (sort-order) should NOT navigate away', async () => {
      const sortOrder = helper.sortOrder;

      await sortOrder.click();

      // Try to press ArrowRight (sort-order has no text input, but test boundary)
      await sortOrder.press('ArrowRight');

      // Should still be in sort-order field
      await expect(sortOrder).toBeFocused();
    });

    test('ArrowLeft at first field (nuclei) should NOT navigate away', async () => {
      const nuclei = helper.nuclei;

      await helper.clearField(nuclei);
      await nuclei.click();
      await nuclei.type('H');

      // Move to start
      await nuclei.press('Home');

      // Press ArrowLeft
      await nuclei.press('ArrowLeft');

      // Should still be in nuclei field (first field)
      await expect(nuclei).toBeFocused();
    });

    test('should navigate through fields within groups with ArrowRight', async () => {
      // Test Metadata group (nuclei → solvent → frequency)
      await helper.clearField(helper.nuclei);
      await helper.nuclei.click();
      await helper.nuclei.type('H');
      await helper.nuclei.press('End');
      await helper.nuclei.press('ArrowRight');
      await expect(helper.solvent).toBeFocused();

      await helper.clearField(helper.solvent);
      await helper.solvent.type('D');
      await helper.solvent.press('End');
      await helper.solvent.press('ArrowRight');
      await expect(helper.frequency).toBeFocused();

      // At end of Metadata group, should NOT move to Settings group
      await helper.frequency.type('5');
      await helper.frequency.press('End');
      await helper.frequency.press('ArrowRight');
      await expect(helper.frequency).toBeFocused();

      // Test Settings group (shift-precision → j-precision → sort-order)
      await helper.shiftPrecision.click();
      await helper.shiftPrecision.type('2');
      await helper.shiftPrecision.press('End');
      await helper.shiftPrecision.press('ArrowRight');
      await expect(helper.jPrecision).toBeFocused();

      await helper.jPrecision.type('1');
      await helper.jPrecision.press('End');
      await helper.jPrecision.press('ArrowRight');
      await expect(helper.sortOrder).toBeFocused();

      // At last field of Settings group, ArrowRight should do nothing
      await helper.sortOrder.press('ArrowRight');
      await expect(helper.sortOrder).toBeFocused();
    });

    test('should navigate backward through fields within groups with ArrowLeft', async () => {
      // Test Settings group backward (sort-order → j-precision → shift-precision)
      await helper.sortOrder.click();
      await helper.sortOrder.press('ArrowLeft');
      await expect(helper.jPrecision).toBeFocused();

      await helper.jPrecision.press('Home');
      await helper.jPrecision.press('ArrowLeft');
      await expect(helper.shiftPrecision).toBeFocused();

      // At start of Settings group, should NOT move to Metadata group
      await helper.shiftPrecision.press('Home');
      await helper.shiftPrecision.press('ArrowLeft');
      await expect(helper.shiftPrecision).toBeFocused();

      // Test Metadata group backward (frequency → solvent → nuclei)
      await helper.frequency.click();
      await helper.frequency.press('Home');
      await helper.frequency.press('ArrowLeft');
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Home');
      await helper.solvent.press('ArrowLeft');
      await expect(helper.nuclei).toBeFocused();

      // At first field, ArrowLeft should do nothing
      await helper.nuclei.press('Home');
      await helper.nuclei.press('ArrowLeft');
      await expect(helper.nuclei).toBeFocused();
    });

    test('cursor position should be correct after navigation', async () => {
      // Navigate from nuclei to solvent with ArrowRight
      await helper.clearField(helper.nuclei);
      await helper.nuclei.click();
      await helper.nuclei.type('Test');
      await helper.nuclei.press('End');
      await helper.nuclei.press('ArrowRight');

      // Should be at start of solvent
      const cursorAtStart = await helper.solvent.evaluate((el) => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(el);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          return preCaretRange.toString().length;
        }
        return -1;
      });
      expect(cursorAtStart).toBe(0);

      // Navigate back to nuclei with ArrowLeft
      await helper.solvent.press('ArrowLeft');

      // Should be at end of nuclei
      const text = await helper.getTextContent(helper.nuclei);
      const cursorAtEnd = await helper.nuclei.evaluate((el) => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(el);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          return preCaretRange.toString().length;
        }
        return -1;
      });
      expect(cursorAtEnd).toBe(text.length);
    });
  });

  test.describe('Combined Navigation Scenarios', () => {
    test('should combine Tab and Arrow navigation', async () => {
      // Tab from nuclei to solvent
      await helper.nuclei.click();
      await helper.nuclei.press('Tab');
      await expect(helper.solvent).toBeFocused();

      // ArrowLeft back to nuclei
      await helper.solvent.press('Home');
      await helper.solvent.press('ArrowLeft');
      await expect(helper.nuclei).toBeFocused();

      // ArrowRight to solvent
      await helper.nuclei.press('End');
      await helper.nuclei.press('ArrowRight');
      await expect(helper.solvent).toBeFocused();

      // Tab to frequency
      await helper.solvent.press('Tab');
      await expect(helper.frequency).toBeFocused();
    });

    test('should work with dropdown selection and arrow navigation', async () => {
      // Select from dropdown using ArrowDown and Enter
      await helper.nuclei.click();
      const dropdown = helper.page.locator('#nuclei-dropdown');
      await expect(dropdown).toHaveClass(/active/);
      
      await helper.nuclei.press('ArrowDown');
      await helper.nuclei.press('Enter');
      await expect(dropdown).not.toHaveClass(/active/);

      // Navigate to next field with ArrowRight
      await helper.nuclei.press('End');
      await helper.nuclei.press('ArrowRight');
      await expect(helper.solvent).toBeFocused();
    });

    test('should maintain state when navigating back and forth', async () => {
      // Set values in multiple fields
      await helper.clearField(helper.nuclei);
      await helper.nuclei.click();
      await helper.nuclei.type('ABC');

      await helper.clearField(helper.solvent);
      await helper.solvent.click();
      await helper.solvent.type('DEF');

      // Navigate: nuclei -> solvent -> nuclei
      await helper.nuclei.click();
      await helper.nuclei.press('End');
      await helper.nuclei.press('ArrowRight');
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Home');
      await helper.solvent.press('ArrowLeft');
      await expect(helper.nuclei).toBeFocused();

      // Values should be preserved
      expect(await helper.getTextContent(helper.nuclei)).toBe('ABC');
      expect(await helper.getTextContent(helper.solvent)).toBe('DEF');
    });
  });

  test.describe('Enter and Shift+Enter Navigation', () => {
    test('Enter key should move to next field within group', async () => {
      // Test Metadata group
      await helper.nuclei.click();
      await helper.nuclei.press('Enter');
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Enter');
      await expect(helper.frequency).toBeFocused();

      // At end of Metadata group, should NOT move to Settings group
      await helper.frequency.press('Enter');
      await expect(helper.frequency).toBeFocused();

      // Test Settings group
      await helper.shiftPrecision.click();
      await helper.shiftPrecision.press('Enter');
      await expect(helper.jPrecision).toBeFocused();

      await helper.jPrecision.press('Enter');
      await expect(helper.sortOrder).toBeFocused();

      // At end of Settings group, should NOT move
      await helper.sortOrder.press('Enter');
      await expect(helper.sortOrder).toBeFocused();
    });

    test('Shift+Enter should move to previous field within group', async () => {
      // Test Settings group backward
      await helper.jPrecision.click();
      await helper.jPrecision.press('Shift+Enter');
      await expect(helper.shiftPrecision).toBeFocused();

      // At start of Settings group, should NOT move to Metadata group
      await helper.shiftPrecision.press('Shift+Enter');
      await expect(helper.shiftPrecision).toBeFocused();

      // Test Metadata group backward
      await helper.frequency.click();
      await helper.frequency.press('Shift+Enter');
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Shift+Enter');
      await expect(helper.nuclei).toBeFocused();

      // At start of Metadata group, should NOT move
      await helper.nuclei.press('Shift+Enter');
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
      expect(html).not.toContain('<br>');
      expect(html).not.toContain('\n');
      
      // Text content should be preserved
      const text = await helper.getTextContent(field);
      expect(text).toBe('Test');
    });

    test('Enter and Shift+Enter should work with numeric fields within group', async () => {
      const field = helper.frequency;

      await field.click();
      await field.type('500');

      // Enter should NOT move to next field (different group)
      await field.press('Enter');
      await expect(field).toBeFocused();

      // Test within Settings group
      await helper.shiftPrecision.click();
      await helper.shiftPrecision.type('3');
      await helper.shiftPrecision.press('Enter');
      await expect(helper.jPrecision).toBeFocused();

      // Shift+Enter should move back
      await helper.jPrecision.press('Shift+Enter');
      await expect(helper.shiftPrecision).toBeFocused();

      // Content should be preserved
      const content = await helper.getTextContent(helper.shiftPrecision);
      expect(content).toBe('3');
    });
  });

  test.describe('Tab Navigation', () => {
    test('Tab key should navigate forward through fields within groups', async () => {
      // Test Metadata group
      await helper.nuclei.click();
      await helper.nuclei.press('Tab');
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Tab');
      await expect(helper.frequency).toBeFocused();

      // At end of Metadata group, should NOT move to Settings group
      await helper.frequency.press('Tab');
      await expect(helper.frequency).toBeFocused();

      // Test Settings group
      await helper.shiftPrecision.click();
      await helper.shiftPrecision.press('Tab');
      await expect(helper.jPrecision).toBeFocused();

      await helper.jPrecision.press('Tab');
      await expect(helper.sortOrder).toBeFocused();
    });

    test('Shift+Tab should navigate backward through fields within groups', async () => {
      // Test Settings group backward
      await helper.jPrecision.click();
      await helper.jPrecision.press('Shift+Tab');
      await expect(helper.shiftPrecision).toBeFocused();

      // At start of Settings group, should NOT move to Metadata group
      await helper.shiftPrecision.press('Shift+Tab');
      await expect(helper.shiftPrecision).toBeFocused();

      // Test Metadata group backward
      await helper.frequency.click();
      await helper.frequency.press('Shift+Tab');
      await expect(helper.solvent).toBeFocused();

      await helper.solvent.press('Shift+Tab');
      await expect(helper.nuclei).toBeFocused();
    });

    test('Tab key should select all text in the target field', async () => {
      // Add some text to nuclei field
      await helper.nuclei.click();
      await helper.nuclei.type('Test Text');
      
      // Tab to solvent field
      await helper.nuclei.press('Tab');
      await expect(helper.solvent).toBeFocused();

      // Type new text - should replace all selected text
      await helper.solvent.type('NewText');
      const content = await helper.getTextContent(helper.solvent);
      
      // The original default text should be replaced
      expect(content).toBe('NewText');
    });

    test('Tab key should select all text in numeric fields', async () => {
      // Set a value in shift-precision field
      await helper.shiftPrecision.click();
      await helper.shiftPrecision.type('2');

      // Tab to j-precision (within same group)
      await helper.shiftPrecision.press('Tab');
      await expect(helper.jPrecision).toBeFocused();

      // Type should replace the default value
      await helper.jPrecision.type('3');
      const content = await helper.getTextContent(helper.jPrecision);
      expect(content).toContain('3');
    });

    test('Shift+Tab should also select all text on navigation', async () => {
      // Start from solvent
      await helper.solvent.click();

      // Shift+Tab to nuclei
      await helper.solvent.press('Shift+Tab');
      await expect(helper.nuclei).toBeFocused();

      // Type should replace all selected text
      await helper.nuclei.type('ABC');
      const content = await helper.getTextContent(helper.nuclei);

      // Should only contain the new text
      expect(content).toBe('ABC');
    });

    test('Tab should select all in fields with existing content', async () => {
      // Set content in multiple fields
      await helper.nuclei.click();
      await helper.nuclei.type('Original1');

      await helper.solvent.click();
      await helper.solvent.type('Original2');

      // Tab from nuclei to solvent
      await helper.nuclei.click();
      await helper.nuclei.press('Tab');
      await expect(helper.solvent).toBeFocused();

      // Type to replace
      await helper.solvent.type('Replaced');
      const content = await helper.getTextContent(helper.solvent);
      expect(content).toBe('Replaced');
    });
  });
});
