import { test, expect } from '@playwright/test';
import { TableHelper } from '../fixtures/test-helpers';

test.describe('Table Section - Keyboard Navigation', () => {
  let helper: TableHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TableHelper(page);
    await helper.goto();
  });

  test.describe('Enter Key Navigation (Vertical)', () => {
    test('Enter should move to cell below in same column', async () => {
      // Add a second row
      await helper.addRow();

      const shift0 = helper.getShiftInput(0);
      const shift1 = helper.getShiftInput(1);

      await shift0.click();
      await shift0.press('Enter');

      // Should focus shift input of row 1
      await expect(shift1).toBeFocused();
    });

    test('Shift+Enter should move to cell above in same column', async () => {
      // Add a second row
      await helper.addRow();

      const shift0 = helper.getShiftInput(0);
      const shift1 = helper.getShiftInput(1);

      await shift1.click();
      await shift1.press('Shift+Enter');

      // Should focus shift input of row 0
      await expect(shift0).toBeFocused();
    });

    test('Enter at last row should create new row and move to it', async () => {
      const initialCount = await helper.getRowCount();

      const shift0 = helper.getShiftInput(0);
      await shift0.click();
      await shift0.press('Enter');

      // Should create new row
      const newCount = await helper.getRowCount();
      expect(newCount).toBe(initialCount + 1);

      // Should focus shift input of new row
      await expect(helper.getShiftInput(1)).toBeFocused();
    });

    test('Enter should work for all column types', async () => {
      // Add a second row
      await helper.addRow();

      // Test shift column
      await helper.getShiftInput(0).click();
      await helper.getShiftInput(0).press('Enter');
      await expect(helper.getShiftInput(1)).toBeFocused();

      // Test multiplicity column
      await helper.getMultiplicityInput(0).click();
      await helper.getMultiplicityInput(0).press('Enter');
      await expect(helper.getMultiplicityInput(1)).toBeFocused();

      // Test integration column
      await helper.getIntegrationInput(0).click();
      await helper.getIntegrationInput(0).press('Enter');
      await expect(helper.getIntegrationInput(1)).toBeFocused();

      // Test assignment column
      await helper.getAssignmentInput(0).click();
      await helper.getAssignmentInput(0).press('Enter');
      await expect(helper.getAssignmentInput(1)).toBeFocused();
    });

    test('Enter should skip disabled J-columns', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value, J2 disabled)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      // From J2 of row 0, press Enter
      await helper.getJInput(0, 1).click();
      await helper.getJInput(0, 1).press('Enter');

      // Should skip disabled J2 of row 1 and go to next enabled input
      // (likely Integration or another column)
      await expect(helper.getJInput(1, 1)).not.toBeFocused();
    });

    test('Shift+Enter at first row should not navigate away', async () => {
      const shift0 = helper.getShiftInput(0);

      await shift0.click();
      await shift0.press('Shift+Enter');

      // Should remain focused on same input
      await expect(shift0).toBeFocused();
    });
  });

  test.describe('Arrow Key Navigation - Vertical', () => {
    test('ArrowDown should move to cell below', async () => {
      await helper.addRow();

      const shift0 = helper.getShiftInput(0);
      const shift1 = helper.getShiftInput(1);

      await shift0.click();
      await shift0.press('ArrowDown');

      await expect(shift1).toBeFocused();
    });

    test('ArrowUp should move to cell above', async () => {
      await helper.addRow();

      const shift0 = helper.getShiftInput(0);
      const shift1 = helper.getShiftInput(1);

      await shift1.click();
      await shift1.press('ArrowUp');

      await expect(shift0).toBeFocused();
    });

    test('ArrowDown at last row should create new row', async () => {
      const initialCount = await helper.getRowCount();

      const shift0 = helper.getShiftInput(0);
      await shift0.click();
      await shift0.press('ArrowDown');

      // Should create new row
      const newCount = await helper.getRowCount();
      expect(newCount).toBe(initialCount + 1);

      // Should focus new row
      await expect(helper.getShiftInput(1)).toBeFocused();
    });

    test('ArrowUp at first row should not navigate away', async () => {
      const shift0 = helper.getShiftInput(0);

      await shift0.click();
      await shift0.press('ArrowUp');

      // Should remain focused
      await expect(shift0).toBeFocused();
    });

    test('ArrowUp/Down should work with number inputs (no value change)', async () => {
      await helper.addRow();

      const int0 = helper.getIntegrationInput(0);
      const int1 = helper.getIntegrationInput(1);

      // Set initial value
      await int0.fill('5');

      // ArrowDown should navigate, not increment value
      await int0.click();
      await int0.press('ArrowDown');

      await expect(int1).toBeFocused();

      // Value should remain unchanged
      expect(await helper.getInputValue(int0)).toBe('5');
    });

    test('ArrowUp/Down should work in contenteditable (Assignment)', async () => {
      await helper.addRow();

      const assign0 = helper.getAssignmentInput(0);
      const assign1 = helper.getAssignmentInput(1);

      await assign0.click();
      await assign0.type('H-8');

      await assign0.press('ArrowDown');
      await expect(assign1).toBeFocused();
    });
  });

  test.describe('Arrow Key Navigation - Horizontal (Text Inputs)', () => {
    test('ArrowRight at end of text should move to next cell', async () => {
      const shift0 = helper.getShiftInput(0);
      const mult0 = helper.getMultiplicityInput(0);

      await shift0.fill('7.53');
      await shift0.click();

      // Move cursor to end
      await shift0.press('End');

      // Press ArrowRight
      await shift0.press('ArrowRight');

      // Should move to multiplicity
      await expect(mult0).toBeFocused();
    });

    test('ArrowLeft at start of text should move to previous cell', async () => {
      const shift0 = helper.getShiftInput(0);
      const mult0 = helper.getMultiplicityInput(0);

      await mult0.fill('d');
      await mult0.click();

      // Move cursor to start
      await mult0.press('Home');

      // Press ArrowLeft
      await mult0.press('ArrowLeft');

      // Should move to shift
      await expect(shift0).toBeFocused();
    });

    test('ArrowRight in middle of text should just move cursor', async () => {
      const shift0 = helper.getShiftInput(0);

      await shift0.fill('7.53');
      await shift0.click();

      // Move to start
      await shift0.press('Home');

      // Get initial cursor position (should be 0)
      let cursorPos = await shift0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(0);

      // Press ArrowRight (should move cursor within text)
      await shift0.press('ArrowRight');

      // Should still be focused on same input
      await expect(shift0).toBeFocused();

      // Cursor should have moved to position 1
      cursorPos = await shift0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(1);
    });

    test('ArrowLeft in middle of text should just move cursor', async () => {
      const shift0 = helper.getShiftInput(0);

      await shift0.fill('7.53');
      await shift0.click();

      // Move to end
      await shift0.press('End');

      // Get initial cursor position (should be at end = 4)
      let cursorPos = await shift0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(4);

      // Press ArrowLeft (should move cursor within text)
      await shift0.press('ArrowLeft');

      // Should still be focused on same input
      await expect(shift0).toBeFocused();

      // Cursor should have moved to position 3
      cursorPos = await shift0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(3);
    });
  });

  test.describe('Arrow Key Navigation - Horizontal (Number Inputs)', () => {
    test('ArrowRight at end of number input should move to next cell', async () => {
      // Set up J-columns
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      const j0 = helper.getJInput(0, 0);
      const j1 = helper.getJInput(0, 1);

      await j0.fill('7.5');
      await j0.click();

      // Move cursor to end
      await j0.press('End');

      // Press ArrowRight
      await j0.press('ArrowRight');

      // Should move to J2
      await expect(j1).toBeFocused();
    });

    test('ArrowLeft at start of number input should move to previous cell', async () => {
      // Set up J-columns
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      const j0 = helper.getJInput(0, 0);
      const j1 = helper.getJInput(0, 1);

      await j1.fill('1.2');
      await j1.click();

      // Move cursor to start
      await j1.press('Home');

      // Press ArrowLeft
      await j1.press('ArrowLeft');

      // Should move to J1
      await expect(j0).toBeFocused();
    });

    test('ArrowRight in middle of number should just move cursor', async () => {
      const int0 = helper.getIntegrationInput(0);

      await int0.fill('123');
      await int0.click();

      // Move to start
      await int0.press('Home');

      // Get initial cursor position
      let cursorPos = await int0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(0);

      // Press ArrowRight (should move cursor within number)
      await int0.press('ArrowRight');

      // Should still be focused
      await expect(int0).toBeFocused();

      // Cursor should have moved
      cursorPos = await int0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(1);
    });

    test('ArrowLeft in middle of number should just move cursor', async () => {
      const int0 = helper.getIntegrationInput(0);

      await int0.fill('123');
      await int0.click();

      // Move to end
      await int0.press('End');

      // Get initial cursor position (at end = 3)
      let cursorPos = await int0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(3);

      // Press ArrowLeft (should move cursor within number)
      await int0.press('ArrowLeft');

      // Should still be focused
      await expect(int0).toBeFocused();

      // Cursor should have moved back
      cursorPos = await int0.evaluate((el: HTMLInputElement) => el.selectionStart);
      expect(cursorPos).toBe(2);
    });
  });

  test.describe('Arrow Key Navigation - Horizontal (Contenteditable)', () => {
    test('ArrowRight at end of assignment should move to next row shift-input', async () => {
      await helper.addRow();
      
      const assign0 = helper.getAssignmentInput(0);
      const shift1 = helper.getShiftInput(1);

      await assign0.click();
      await assign0.type('H-8');

      // Press ArrowRight (cursor should be at end after typing)
      await assign0.press('ArrowRight');

      // Should move to next row's shift-input
      await expect(shift1).toBeFocused();
    });

    test('ArrowRight at end of assignment on last row should create new row', async () => {
      const initialCount = await helper.getRowCount();
      
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('H-8');

      // Press ArrowRight (cursor should be at end after typing)
      await assign0.press('ArrowRight');

      // Should create new row
      const newCount = await helper.getRowCount();
      expect(newCount).toBe(initialCount + 1);

      // Should focus new row's shift-input
      await expect(helper.getShiftInput(1)).toBeFocused();
    });

    test('ArrowLeft at start of contenteditable should move to previous cell', async () => {
      const int0 = helper.getIntegrationInput(0);
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('H-8');

      // Move cursor to start
      await assign0.press('Home');

      // Press ArrowLeft
      await assign0.press('ArrowLeft');

      // Should move to integration
      await expect(int0).toBeFocused();
    });

    test('ArrowRight/Left in middle of contenteditable should just move cursor', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('H-8-Test');

      // Move to start
      await assign0.press('Home');

      // Get cursor position at start
      let cursorPos = await assign0.evaluate((el) => {
        const sel = window.getSelection();
        return sel ? sel.focusOffset : -1;
      });
      expect(cursorPos).toBe(0);

      // Press ArrowRight (should move cursor within text)
      await assign0.press('ArrowRight');
      await expect(assign0).toBeFocused();

      // Cursor should have moved
      cursorPos = await assign0.evaluate((el) => {
        const sel = window.getSelection();
        return sel ? sel.focusOffset : -1;
      });
      expect(cursorPos).toBeGreaterThan(0);

      // Move to end
      await assign0.press('End');

      const textLength = await assign0.evaluate((el) => el.textContent?.length || 0);

      // Press ArrowLeft (should move cursor within text)
      await assign0.press('ArrowLeft');
      await expect(assign0).toBeFocused();

      // Cursor should have moved back from end
      cursorPos = await assign0.evaluate((el) => {
        const sel = window.getSelection();
        return sel ? sel.focusOffset : -1;
      });
      expect(cursorPos).toBeLessThan(textLength);
    });
  });

  test.describe('Arrow Key Navigation - Skip Hidden/Disabled Columns', () => {
    test('should skip hidden J-columns when navigating horizontally', async () => {
      // Row has 'd' (only 1 J-column)
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const mult0 = helper.getMultiplicityInput(0);
      const j0 = helper.getJInput(0, 0);
      const int0 = helper.getIntegrationInput(0);

      // Navigate from multiplicity to J1
      await mult0.click();
      await mult0.press('End');
      await mult0.press('ArrowRight');
      await expect(j0).toBeFocused();

      // Navigate from J1 to Integration (skip hidden J2)
      await j0.press('End');
      await j0.press('ArrowRight');
      await expect(int0).toBeFocused();
    });

    test('should skip disabled J-columns when navigating horizontally', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value, J2 disabled)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      const j1_0 = helper.getJInput(1, 0);
      const int1 = helper.getIntegrationInput(1);

      // Navigate from J1 (enabled) to Integration (skip disabled J2)
      await j1_0.click();
      await j1_0.press('End');
      await j1_0.press('ArrowRight');

      await expect(int1).toBeFocused();
    });

    test('should skip disabled J-columns when navigating vertically', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value, J2 disabled)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      const j0_1 = helper.getJInput(0, 1);

      // Navigate down from J2 of row 0
      await j0_1.click();
      await j0_1.press('ArrowDown');

      // Should skip disabled J2 of row 1
      await expect(helper.getJInput(1, 1)).not.toBeFocused();
    });
  });

  test.describe('Tab Navigation', () => {
    test('Tab should move to next cell (left to right)', async () => {
      const shift0 = helper.getShiftInput(0);
      const mult0 = helper.getMultiplicityInput(0);

      await shift0.click();
      await shift0.press('Tab');

      await expect(mult0).toBeFocused();
    });

    test('Shift+Tab should move to previous cell (right to left)', async () => {
      const shift0 = helper.getShiftInput(0);
      const mult0 = helper.getMultiplicityInput(0);

      await mult0.click();
      await mult0.press('Shift+Tab');

      await expect(shift0).toBeFocused();
    });

    test('Tab at end of row should move to first cell of next row', async () => {
      await helper.addRow();

      const assign0 = helper.getAssignmentInput(0);
      const shift1 = helper.getShiftInput(1);

      await assign0.click();
      await assign0.press('Tab');

      await expect(shift1).toBeFocused();
    });

    test('Shift+Tab at start of row should move to last cell of previous row', async () => {
      await helper.addRow();

      const shift1 = helper.getShiftInput(1);
      const assign0 = helper.getAssignmentInput(0);

      await shift1.click();
      await shift1.press('Shift+Tab');

      await expect(assign0).toBeFocused();
    });

    test('Tab should skip hidden J-columns', async () => {
      // Row has 'd' (only 1 J-column)
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const mult0 = helper.getMultiplicityInput(0);
      const j0 = helper.getJInput(0, 0);
      const int0 = helper.getIntegrationInput(0);

      // Tab from multiplicity
      await mult0.click();
      await mult0.press('Tab');
      await expect(j0).toBeFocused();

      // Tab from J1 should skip hidden J2 and go to integration
      await j0.press('Tab');
      await expect(int0).toBeFocused();
    });

    test('Tab should skip disabled J-columns', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value, J2 disabled)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      const j1_0 = helper.getJInput(1, 0);
      const int1 = helper.getIntegrationInput(1);

      // Tab from J1 should skip disabled J2
      await j1_0.click();
      await j1_0.press('Tab');

      await expect(int1).toBeFocused();
    });
  });

  test.describe('No Newline on Enter in Assignment', () => {
    test('Enter in Assignment should not create newline', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Line1');
      await assign0.press('Enter');

      const html = await helper.getAssignmentHTML(0);

      // Should not contain <br>
      expect(html).not.toContain('<br>');
    });

    test('Enter in Assignment should navigate to next row', async () => {
      await helper.addRow();

      const assign0 = helper.getAssignmentInput(0);
      const assign1 = helper.getAssignmentInput(1);

      await assign0.click();
      await assign0.type('H-8');
      await assign0.press('Enter');

      // Should move to next row's assignment
      await expect(assign1).toBeFocused();
    });

    test('Multiple Enter presses should not create multiple newlines', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Text');
      await assign0.press('Enter');
      await assign0.press('Enter');
      await assign0.press('Enter');

      const html = await helper.getAssignmentHTML(0);

      // Should not contain any <br>
      expect(html).not.toContain('<br>');
    });
  });

  test.describe('Complete Navigation Flow', () => {
    test('should navigate through entire table with Tab', async () => {
      await helper.addRow();

      // Start from first cell
      await helper.getShiftInput(0).click();

      // Tab through all cells in row 0
      await helper.page.keyboard.press('Tab');
      await expect(helper.getMultiplicityInput(0)).toBeFocused();

      // Continue tabbing (will vary based on J-columns)
      await helper.page.keyboard.press('Tab');
      await helper.page.keyboard.press('Tab');
      await helper.page.keyboard.press('Tab');

      // Eventually should reach row 1
      const rowCount = await helper.getRowCount();
      expect(rowCount).toBe(2);
    });

    test('should navigate entire column with ArrowDown', async () => {
      // Add multiple rows
      await helper.addRow();
      await helper.addRow();

      const shift0 = helper.getShiftInput(0);
      const shift1 = helper.getShiftInput(1);
      const shift2 = helper.getShiftInput(2);

      await shift0.click();

      // ArrowDown to row 1
      await shift0.press('ArrowDown');
      await expect(shift1).toBeFocused();

      // ArrowDown to row 2
      await shift1.press('ArrowDown');
      await expect(shift2).toBeFocused();

      // ArrowDown from last row should create new row
      await shift2.press('ArrowDown');
      const newCount = await helper.getRowCount();
      expect(newCount).toBe(4);
    });

    test('should maintain data while navigating', async () => {
      // Enter data in multiple cells
      await helper.getShiftInput(0).fill('7.53');
      await helper.getMultiplicityInput(0).fill('d');
      await helper.getIntegrationInput(0).fill('3');

      // Navigate around
      await helper.getShiftInput(0).click();
      await helper.page.keyboard.press('Tab');
      await helper.page.keyboard.press('Tab');
      await helper.page.keyboard.press('Shift+Tab');
      await helper.page.keyboard.press('Shift+Tab');

      // Data should be preserved
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('7.53');
      expect(await helper.getInputValue(helper.getMultiplicityInput(0))).toBe('d');
      expect(await helper.getInputValue(helper.getIntegrationInput(0))).toBe('3');
    });
  });
});
