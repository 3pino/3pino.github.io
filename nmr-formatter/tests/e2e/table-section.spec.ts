import { test, expect } from '@playwright/test';
import { TableHelper } from '../fixtures/test-helpers';

test.describe('Table Section - Data Input & Validation', () => {
  let helper: TableHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TableHelper(page);
    await helper.goto();
  });

  test.describe('Shift Input', () => {
    test('should accept single numeric value', async () => {
      const shiftInput = helper.getShiftInput(0);
      await shiftInput.fill('7.53');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.53');
    });

    test('should accept range input with en-dash', async () => {
      const shiftInput = helper.getShiftInput(0);
      await shiftInput.fill('7.53–7.50');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.53–7.50');
    });

    test('should accept range input with hyphen', async () => {
      const shiftInput = helper.getShiftInput(0);
      await shiftInput.fill('7.53-7.50');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.53-7.50');
    });

    test('should accept alphabetic characters (for complex ranges)', async () => {
      const shiftInput = helper.getShiftInput(0);
      await shiftInput.fill('7.53a');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.53');
    });
  });

  test.describe('Multiplicity Input', () => {
    test('should accept standard multiplicity values', async () => {
      const multInput = helper.getMultiplicityInput(0);

      const standardValues = ['s', 'd', 't', 'q', 'm'];

      for (const mult of standardValues) {
        await multInput.fill(mult);
        const value = await helper.getInputValue(multInput);
        expect(value).toBe(mult);
      }
    });

    test('should accept complex multiplicity values', async () => {
      const multInput = helper.getMultiplicityInput(0);

      const complexValues = ['dd', 'dt', 'ddd', 'td', 'dddd'];

      for (const mult of complexValues) {
        await multInput.fill(mult);
        const value = await helper.getInputValue(multInput);
        expect(value).toBe(mult);
      }
    });

    test('should accept uppercase multiplicity', async () => {
      const multInput = helper.getMultiplicityInput(0);

      await multInput.fill('DD');
      const value = await helper.getInputValue(multInput);
      expect(value).toBe('DD');
    });

    test('should trigger J-column visibility change', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Initially no J columns visible
      let visibleJCount = await helper.getVisibleJColumnCount();
      expect(visibleJCount).toBe(0);

      // Enter 'dd' - should show 2 J columns
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100); // Wait for update

      visibleJCount = await helper.getVisibleJColumnCount();
      expect(visibleJCount).toBe(2);

      // Enter 'd' - should show 1 J column
      await multInput.fill('d');
      await helper.page.waitForTimeout(100);

      visibleJCount = await helper.getVisibleJColumnCount();
      expect(visibleJCount).toBe(1);
    });
  });

  test.describe('J-Value Input', () => {
    test('should accept numeric values', async () => {
      const multInput = helper.getMultiplicityInput(0);
      await multInput.fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);
      await jInput.fill('7.5');

      const value = await helper.getInputValue(jInput);
      expect(value).toBe('7.5');
    });

    test('should accept decimal values', async () => {
      const multInput = helper.getMultiplicityInput(0);
      await multInput.fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);
      await jInput.fill('7.53');

      const value = await helper.getInputValue(jInput);
      expect(value).toBe('7.53');
    });

    test('should accept values in valid range (0-999.9)', async () => {
      const multInput = helper.getMultiplicityInput(0);
      await multInput.fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      // Test minimum
      await jInput.fill('0');
      expect(await helper.getInputValue(jInput)).toBe('0');

      // Test maximum
      await jInput.fill('999.9');
      expect(await helper.getInputValue(jInput)).toBe('999.9');

      // Test mid-range
      await jInput.fill('15.5');
      expect(await helper.getInputValue(jInput)).toBe('15.5');
    });

    test('should show correct number of J-inputs based on multiplicity', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // dd = 2 J-values
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100);

      expect(await helper.isJCellVisible(0, 0)).toBe(true);
      expect(await helper.isJCellVisible(0, 1)).toBe(true);
      expect(await helper.isJCellVisible(0, 2)).toBe(false);

      // ddd = 3 J-values
      await multInput.fill('ddd');
      await helper.page.waitForTimeout(100);

      expect(await helper.isJCellVisible(0, 0)).toBe(true);
      expect(await helper.isJCellVisible(0, 1)).toBe(true);
      expect(await helper.isJCellVisible(0, 2)).toBe(true);
      expect(await helper.isJCellVisible(0, 3)).toBe(false);
    });

    test('should hide unnecessary J-columns when multiplicity changes', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Start with 'ddd' (3 J-values)
      await multInput.fill('ddd');
      await helper.page.waitForTimeout(100);

      expect(await helper.getVisibleJColumnCount()).toBe(3);

      // Change to 'd' (1 J-value)
      await multInput.fill('d');
      await helper.page.waitForTimeout(100);

      expect(await helper.getVisibleJColumnCount()).toBe(1);
    });
  });

  test.describe('Integration Input', () => {
    test('should accept positive integers', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.fill('1');
      expect(await helper.getInputValue(intInput)).toBe('1');

      await intInput.fill('10');
      expect(await helper.getInputValue(intInput)).toBe('10');

      await intInput.fill('100');
      expect(await helper.getInputValue(intInput)).toBe('100');
    });

    test('should accept zero', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.fill('0');
      expect(await helper.getInputValue(intInput)).toBe('0');
    });


  });

  test.describe('Assignment Input (contenteditable)', () => {
    test('should accept text input', async () => {
      const assignmentInput = helper.getAssignmentInput(0);

      await assignmentInput.click();
      await assignmentInput.type('H-8');

      const text = await helper.getAssignmentText(0);
      expect(text).toBe('H-8');
    });

    test('should show placeholder when empty', async () => {
      const assignmentInput = helper.getAssignmentInput(0);

      // Ensure it's empty
      await helper.clearInput(assignmentInput);
      await assignmentInput.blur();

      const isPlaceholder = await helper.isAssignmentPlaceholderVisible(0);
      expect(isPlaceholder).toBe(true);
    });

    test('should clear content and show placeholder after entering only whitespace', async () => {
      const assignmentInput = helper.getAssignmentInput(0);

      // Type whitespace
      await assignmentInput.click();
      await assignmentInput.type('   ');

      // Blur to trigger cleanup
      await assignmentInput.blur();

      const isPlaceholder = await helper.isAssignmentPlaceholderVisible(0);
      expect(isPlaceholder).toBe(true);
    });

    test('should not accept newline (Enter key)', async () => {
      const assignmentInput = helper.getAssignmentInput(0);

      await assignmentInput.click();
      await assignmentInput.type('Line1');
      await assignmentInput.press('Enter');
      await assignmentInput.type('Line2');

      const html = await helper.getAssignmentHTML(0);

      // Should not contain <br> or multiple lines
      expect(html).not.toContain('<br>');
      expect(html).not.toContain('\n');
    });
  });

  test.describe('Row Management', () => {
    test('should add a new row when "+" cell is clicked', async () => {
      const initialCount = await helper.getRowCount();

      await helper.addRow();

      const newCount = await helper.getRowCount();
      expect(newCount).toBe(initialCount + 1);
    });

    test('should initialize new row with empty data', async () => {
      await helper.addRow();

      const rowIndex = (await helper.getRowCount()) - 1;

      expect(await helper.getInputValue(helper.getShiftInput(rowIndex))).toBe('');
      expect(await helper.getInputValue(helper.getMultiplicityInput(rowIndex))).toBe('');
      expect(await helper.getInputValue(helper.getIntegrationInput(rowIndex))).toBe('');
      expect(await helper.isAssignmentPlaceholderVisible(rowIndex)).toBe(true);
    });

    test('should add row with J-columns already visible (when existing rows have multiplicity)', async () => {
      const multInput = helper.getMultiplicityInput(0);
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100);

      // Add new row
      await helper.addRow();

      // New row should have J-columns visible but disabled
      expect(await helper.isJCellVisible(1, 0)).toBe(true);
      expect(await helper.isJCellVisible(1, 1)).toBe(true);

      expect(await helper.isJInputDisabled(1, 0)).toBe(true);
      expect(await helper.isJInputDisabled(1, 1)).toBe(true);
    });

    test('should delete a row when delete button is clicked', async () => {
      // Add a second row
      await helper.addRow();

      const initialCount = await helper.getRowCount();
      expect(initialCount).toBe(2);

      // Delete first row
      await helper.deleteRow(0);

      const newCount = await helper.getRowCount();
      expect(newCount).toBe(1);
    });

    test('should not allow deleting the last row', async () => {
      const initialCount = await helper.getRowCount();
      expect(initialCount).toBe(1);

      // Try to delete the only row
      await helper.deleteRow(0);

      // Should still have 1 row (empty row should be created)
      const newCount = await helper.getRowCount();
      expect(newCount).toBe(1);
    });

    test('should delete row and adjust J-columns accordingly', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      // Should have 2 J-columns visible (max of row0 and row1)
      expect(await helper.getVisibleJColumnCount()).toBe(2);

      // Delete row 0
      await helper.deleteRow(0);
      await helper.page.waitForTimeout(100);

      // Should now have 1 J-column visible (only row1 with 'd')
      expect(await helper.getVisibleJColumnCount()).toBe(1);
    });

    test('should preserve data in other rows after deletion', async () => {
      // Set data in row 0
      await helper.getShiftInput(0).fill('7.53');
      await helper.getMultiplicityInput(0).fill('d');

      // Add row 1 with data
      await helper.addRow();
      await helper.getShiftInput(1).fill('3.25');
      await helper.getMultiplicityInput(1).fill('s');

      // Delete row 0
      await helper.deleteRow(0);

      // Row 1's data should now be at index 0
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('3.25');
      expect(await helper.getInputValue(helper.getMultiplicityInput(0))).toBe('s');
    });
  });

  test.describe('Dynamic J-Column Display & Disabled State', () => {
    test('should show max J-columns across all rows', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: ddd (3 J-values)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('ddd');
      await helper.page.waitForTimeout(100);

      // Should show 3 J-columns (max)
      expect(await helper.getVisibleJColumnCount()).toBe(3);
    });

    test('should disable J-inputs for rows that do not need them', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      // Row 0: J1, J2 should be enabled
      expect(await helper.isJInputDisabled(0, 0)).toBe(false);
      expect(await helper.isJInputDisabled(0, 1)).toBe(false);

      // Row 1: J1 enabled, J2 disabled
      expect(await helper.isJInputDisabled(1, 0)).toBe(false);
      expect(await helper.isJInputDisabled(1, 1)).toBe(true);
    });

    test('should grey out disabled J-inputs', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      // Row 1's J2 should be disabled and greyed out
      expect(await helper.isJInputDisabled(1, 1)).toBe(true);
      expect(await helper.isJInputGreyedOut(1, 1)).toBe(true);
    });

    test('should disable all J-inputs for empty rows', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: empty
      await helper.addRow();

      // Row 1: All J-inputs should be disabled
      expect(await helper.isJInputDisabled(1, 0)).toBe(true);
      expect(await helper.isJInputDisabled(1, 1)).toBe(true);

      // And greyed out
      expect(await helper.isJInputGreyedOut(1, 0)).toBe(true);
      expect(await helper.isJInputGreyedOut(1, 1)).toBe(true);
    });

    test('should update J-column headers dynamically (J1, J2, J3...)', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Start with 'ddd' (3 J-values)
      await multInput.fill('ddd');
      await helper.page.waitForTimeout(100);

      // Check headers
      const j1Header = helper.page.locator('#nmr-table thead th').filter({ hasText: 'J1' });
      const j2Header = helper.page.locator('#nmr-table thead th').filter({ hasText: 'J2' });
      const j3Header = helper.page.locator('#nmr-table thead th').filter({ hasText: 'J3' });

      await expect(j1Header).toBeVisible();
      await expect(j2Header).toBeVisible();
      await expect(j3Header).toBeVisible();
    });
  });

  test.describe('Validation Tests', () => {
    test('should not show error before Generate Text is clicked', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Leave shift empty (invalid for ¹H NMR)
      await shiftInput.fill('');

      // Should not have error class
      expect(await helper.hasError(shiftInput)).toBe(false);
    });

    test('should show error after Generate Text is clicked (invalid data)', async () => {
      const shiftInput = helper.getShiftInput(0);
      const multInput = helper.getMultiplicityInput(0);

      // Enter multiplicity so row is not considered empty
      await multInput.fill('d');

      // Leave shift empty (invalid)
      await shiftInput.fill('');

      // Click Generate Text
      await helper.generateText();
      await helper.page.waitForTimeout(100);

      // Should now have error class
      expect(await helper.hasError(shiftInput)).toBe(true);
    });

    test('should clear error after fixing invalid data', async () => {
      const shiftInput = helper.getShiftInput(0);
      const multInput = helper.getMultiplicityInput(0);

      // Enter multiplicity so row is not considered empty
      await multInput.fill('d');

      // Leave shift empty
      await shiftInput.fill('');

      // Generate Text to trigger error
      await helper.generateText();
      await helper.page.waitForTimeout(100);

      expect(await helper.hasError(shiftInput)).toBe(true);

      // Fix the error
      await shiftInput.fill('7.53');

      // Error should be cleared
      expect(await helper.hasError(shiftInput)).toBe(false);
    });

    test('should re-validate and show error again after fixing and re-breaking', async () => {
      const shiftInput = helper.getShiftInput(0);
      const multInput = helper.getMultiplicityInput(0);

      // Enter multiplicity so row is not considered empty
      await multInput.fill('d');

      // Step 1: Enter invalid data
      await shiftInput.fill('');

      // Step 2: Generate Text - should show error
      await helper.generateText();
      await helper.page.waitForTimeout(100);
      expect(await helper.hasError(shiftInput)).toBe(true);

      // Step 3: Fix the error
      await shiftInput.fill('7.53');
      expect(await helper.hasError(shiftInput)).toBe(false);

      // Step 4: Re-break - enter invalid data again
      await shiftInput.fill('');

      // Step 5: Generate Text again - should show error again
      await helper.generateText();
      await helper.page.waitForTimeout(100);

      // Step 6: Verify error is shown
      expect(await helper.hasError(shiftInput)).toBe(true);
    });
  });

  test.describe('State Persistence', () => {
    test('should preserve input values after cell navigation', async () => {
      const shiftInput = helper.getShiftInput(0);
      const multInput = helper.getMultiplicityInput(0);

      // Enter data
      await shiftInput.fill('7.53');
      await multInput.fill('d');

      // Navigate away and back
      await helper.getIntegrationInput(0).click();
      await shiftInput.click();

      // Values should be preserved
      expect(await helper.getInputValue(shiftInput)).toBe('7.53');
      expect(await helper.getInputValue(multInput)).toBe('d');
    });

    test('should preserve data after row addition', async () => {
      const shiftInput = helper.getShiftInput(0);
      await shiftInput.fill('7.53');

      // Add a new row
      await helper.addRow();

      // Original data should be preserved
      expect(await helper.getInputValue(shiftInput)).toBe('7.53');
    });

    test('should preserve J-values when multiplicity changes', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Enter 'dd' and fill J-values
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100);

      await helper.getJInput(0, 0).fill('7.5');
      await helper.getJInput(0, 1).fill('1.2');

      // Change to 'd' (hides J2)
      await multInput.fill('d');
      await helper.page.waitForTimeout(100);

      expect(await helper.isJCellVisible(0, 1)).toBe(false);

      // Change back to 'dd' (shows J2 again)
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100);

      // J-values should be preserved
      expect(await helper.getInputValue(helper.getJInput(0, 0))).toBe('7.5');
      expect(await helper.getInputValue(helper.getJInput(0, 1))).toBe('1.2');
    });

    test('should preserve J-values through multiple multiplicity changes', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Start with 'ddd' and fill all 3 J-values
      await multInput.fill('ddd');
      await helper.page.waitForTimeout(100);

      await helper.getJInput(0, 0).fill('7.5');
      await helper.getJInput(0, 1).fill('1.2');
      await helper.getJInput(0, 2).fill('0.8');

      // Change to 'd' (only J1 visible)
      await multInput.fill('d');
      await helper.page.waitForTimeout(100);

      // Change to 'dd' (J1, J2 visible)
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100);

      // Change back to 'ddd' (all 3 visible)
      await multInput.fill('ddd');
      await helper.page.waitForTimeout(100);

      // All J-values should be preserved
      expect(await helper.getInputValue(helper.getJInput(0, 0))).toBe('7.5');
      expect(await helper.getInputValue(helper.getJInput(0, 1))).toBe('1.2');
      expect(await helper.getInputValue(helper.getJInput(0, 2))).toBe('0.8');
    });
  });

  test.describe('Add Row Footer ColSpan', () => {
    test('should have correct colspan when no J-columns are visible', async () => {
      // Initially no multiplicity, so no J-columns
      const colSpan = await helper.getAddRowCellColSpan();
      const expected = await helper.getExpectedAddRowColSpan();

      expect(colSpan).toBe(expected); // Should be 4 (shift + mult + int + assignment)
    });

    test('should update colspan when multiplicity is added', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Initially no J-columns
      let colSpan = await helper.getAddRowCellColSpan();
      let expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // 4

      // Add 'dd' - 2 J-columns
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100);

      colSpan = await helper.getAddRowCellColSpan();
      expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // Should be 6 (4 + 2)
    });

    test('should update colspan when multiplicity changes from dd to ddd', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Start with 'dd' - 2 J-columns
      await multInput.fill('dd');
      await helper.page.waitForTimeout(100);

      let colSpan = await helper.getAddRowCellColSpan();
      let expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // 6

      // Change to 'ddd' - 3 J-columns
      await multInput.fill('ddd');
      await helper.page.waitForTimeout(100);

      colSpan = await helper.getAddRowCellColSpan();
      expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // Should be 7 (4 + 3)
    });

    test('should update colspan when multiplicity is removed', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Start with 'ddd' - 3 J-columns
      await multInput.fill('ddd');
      await helper.page.waitForTimeout(100);

      let colSpan = await helper.getAddRowCellColSpan();
      let expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // 7

      // Clear multiplicity
      await multInput.fill('');
      await helper.page.waitForTimeout(100);

      colSpan = await helper.getAddRowCellColSpan();
      expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // Should be 4 (4 + 0)
    });

    test('should update colspan when row with max J-columns is deleted', async () => {
      // Row 0: ddd (3 J-values)
      await helper.getMultiplicityInput(0).fill('ddd');
      await helper.page.waitForTimeout(100);

      // Add Row 1: d (1 J-value)
      await helper.addRow();
      await helper.getMultiplicityInput(1).fill('d');
      await helper.page.waitForTimeout(100);

      // Should have 3 J-columns visible (max)
      let colSpan = await helper.getAddRowCellColSpan();
      let expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // 7 (4 + 3)

      // Delete row 0 (which has ddd)
      await helper.deleteRow(0);
      await helper.page.waitForTimeout(100);

      // Should now have 1 J-column visible (only row1 with 'd')
      colSpan = await helper.getAddRowCellColSpan();
      expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // Should be 5 (4 + 1)
    });

    test('should maintain correct colspan across multiple row additions', async () => {
      // Row 0: dd (2 J-values)
      await helper.getMultiplicityInput(0).fill('dd');
      await helper.page.waitForTimeout(100);

      let colSpan = await helper.getAddRowCellColSpan();
      let expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // 6

      // Add Row 1: empty (0 J-values)
      await helper.addRow();
      await helper.page.waitForTimeout(100);

      colSpan = await helper.getAddRowCellColSpan();
      expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // Still 6 (max is still 2)

      // Add Row 2: ddd (3 J-values)
      await helper.addRow();
      await helper.getMultiplicityInput(2).fill('ddd');
      await helper.page.waitForTimeout(100);

      colSpan = await helper.getAddRowCellColSpan();
      expected = await helper.getExpectedAddRowColSpan();
      expect(colSpan).toBe(expected); // Should be 7 (4 + 3)
    });
  });
});
