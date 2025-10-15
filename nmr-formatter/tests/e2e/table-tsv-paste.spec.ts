import { test, expect } from '@playwright/test';
import { TableHelper } from '../fixtures/test-helpers';

test.describe('Table Section - TSV Paste', () => {
  let helper: TableHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TableHelper(page);
    await helper.goto();
  });

  test.describe('Multi-column TSV paste', () => {
    test('should paste TSV data starting from shift column', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Paste TSV data: shift, mult, J1, J2, int, assignment
      const tsvData = '7.53\tdd\t7.5\t1.2\t1\tH-8';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete (async processing)
      await helper.page.waitForTimeout(500);

      // Verify all fields were filled
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('7.53');
      expect(await helper.getInputValue(helper.getMultiplicityInput(0))).toBe('dd');
      expect(await helper.getInputValue(helper.getJInput(0, 0))).toBe('7.5');
      expect(await helper.getInputValue(helper.getJInput(0, 1))).toBe('1.2');
      expect(await helper.getInputValue(helper.getIntegrationInput(0))).toBe('1');
      expect(await helper.getAssignmentInput(0).innerHTML()).toBe('H-8');
    });

    test('should paste TSV data starting from multiplicity column', async () => {
      const multInput = helper.getMultiplicityInput(0);

      // Paste TSV data: mult, J1, J2, int, assignment
      const tsvData = 'dd\t7.5\t1.2\t2\tCH2';
      await multInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete (async processing)
      await helper.page.waitForTimeout(500);

      // Verify fields from multiplicity onwards were filled
      expect(await helper.getInputValue(helper.getMultiplicityInput(0))).toBe('dd');
      expect(await helper.getInputValue(helper.getJInput(0, 0))).toBe('7.5');
      expect(await helper.getInputValue(helper.getJInput(0, 1))).toBe('1.2');
      expect(await helper.getInputValue(helper.getIntegrationInput(0))).toBe('2');
      expect(await helper.getAssignmentInput(0).innerHTML()).toBe('CH2');
    });

    test('should paste TSV data starting from integration column', async () => {
      const intInput = helper.getIntegrationInput(0);

      // Paste TSV data: int, assignment
      const tsvData = '3\tCH3';
      await intInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete (async processing)
      await helper.page.waitForTimeout(500);

      // Verify fields were filled
      expect(await helper.getInputValue(helper.getIntegrationInput(0))).toBe('3');
      expect(await helper.getAssignmentInput(0).innerHTML()).toBe('CH3');
    });

    test('should dynamically show J-columns based on multiplicity', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Initially, no J-columns should be visible (multiplicity is empty)
      const initialJColumns = await helper.getVisibleJColumnCount();
      expect(initialJColumns).toBe(0);

      // Paste data with 'dd' multiplicity (requires 2 J-values)
      const tsvData = '7.53\tdd\t7.5\t1.2\t1\tH-8';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for J-columns to update
      await helper.page.waitForTimeout(200);

      // Verify 2 J-columns are now visible
      const jColumnsAfterPaste = await helper.getVisibleJColumnCount();
      expect(jColumnsAfterPaste).toBe(2);
    });

    test('should not create columns beyond assignment', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Paste data with extra columns beyond assignment
      const tsvData = '7.53\tdd\t7.5\t1.2\t1\tH-8\textra1\textra2';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete (async processing)
      await helper.page.waitForTimeout(500);

      // Verify assignment contains only 'H-8', not the extra data
      expect(await helper.getAssignmentInput(0).innerHTML()).toBe('H-8');

      // Verify row count is still 1
      expect(await helper.getRowCount()).toBe(1);
    });
  });

  test.describe('Multi-row TSV paste', () => {
    test('should paste multiple rows of TSV data', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Paste 3 rows of data
      const tsvData = '7.53\tdd\t7.5\t1.2\t1\tH-8\n4.5\ts\t\t\t2\tCH2\n3.2\td\t6.5\t\t3\tCH3';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete
      await helper.page.waitForTimeout(300);

      // Verify 3 rows were created
      expect(await helper.getRowCount()).toBe(3);

      // Verify row 0 data
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('7.53');
      expect(await helper.getInputValue(helper.getMultiplicityInput(0))).toBe('dd');
      expect(await helper.getAssignmentInput(0).innerHTML()).toBe('H-8');

      // Verify row 1 data
      expect(await helper.getInputValue(helper.getShiftInput(1))).toBe('4.5');
      expect(await helper.getInputValue(helper.getMultiplicityInput(1))).toBe('s');
      expect(await helper.getInputValue(helper.getIntegrationInput(1))).toBe('2');
      expect(await helper.getAssignmentInput(1).innerHTML()).toBe('CH2');

      // Verify row 2 data
      expect(await helper.getInputValue(helper.getShiftInput(2))).toBe('3.2');
      expect(await helper.getInputValue(helper.getMultiplicityInput(2))).toBe('d');
      expect(await helper.getInputValue(helper.getJInput(2, 0))).toBe('6.5');
      expect(await helper.getInputValue(helper.getIntegrationInput(2))).toBe('3');
      expect(await helper.getAssignmentInput(2).innerHTML()).toBe('CH3');
    });

    test('should paste rows starting from non-first row', async () => {
      // Add a second row first
      await helper.addRow();

      const shiftInput = helper.getShiftInput(1);

      // Paste 2 rows starting from row 1
      const tsvData = '7.53\tdd\t7.5\t1.2\t1\tH-8\n4.5\ts\t\t\t2\tCH2';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete
      await helper.page.waitForTimeout(300);

      // Verify 3 rows total (1 original + 2 pasted)
      expect(await helper.getRowCount()).toBe(3);

      // Verify row 0 is still empty
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('');

      // Verify row 1 has first pasted data
      expect(await helper.getInputValue(helper.getShiftInput(1))).toBe('7.53');
      expect(await helper.getAssignmentInput(1).innerHTML()).toBe('H-8');

      // Verify row 2 has second pasted data
      expect(await helper.getInputValue(helper.getShiftInput(2))).toBe('4.5');
      expect(await helper.getAssignmentInput(2).innerHTML()).toBe('CH2');
    });
  });

  test.describe('Single row/column TSV paste', () => {
    test('should paste single row with newline', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Single row with trailing newline
      const tsvData = '7.53\tdd\t7.5\t1.2\t1\tH-8\n';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete (async processing)
      await helper.page.waitForTimeout(500);

      // Verify only 1 row exists
      expect(await helper.getRowCount()).toBe(1);
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('7.53');
      expect(await helper.getAssignmentInput(0).innerHTML()).toBe('H-8');
    });

    test('should paste single column (multiple rows, one value each)', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Single column data (newline-separated)
      const tsvData = '7.53\n4.5\n3.2';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete
      await helper.page.waitForTimeout(200);

      // Verify 3 rows were created
      expect(await helper.getRowCount()).toBe(3);

      // Verify shift values
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('7.53');
      expect(await helper.getInputValue(helper.getShiftInput(1))).toBe('4.5');
      expect(await helper.getInputValue(helper.getShiftInput(2))).toBe('3.2');

      // Other fields should be empty
      expect(await helper.getInputValue(helper.getMultiplicityInput(0))).toBe('');
      expect(await helper.getInputValue(helper.getMultiplicityInput(1))).toBe('');
      expect(await helper.getInputValue(helper.getMultiplicityInput(2))).toBe('');
    });
  });

  test.describe('Validation after TSV paste', () => {
    test('should accept pasted data without immediate validation errors', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Paste data - validation happens on blur or generate
      const tsvData = '7.53	dd	7.5	1.2	1	H-8';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete (async processing)
      await helper.page.waitForTimeout(500);

      // Verify data was pasted
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('7.53');
      expect(await helper.getInputValue(helper.getMultiplicityInput(0))).toBe('dd');
    });

    test('should paste and accept decimal integration values', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Paste data with decimal integration value
      const tsvData = '7.53	s	1.5	H-8';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete (async processing)
      await helper.page.waitForTimeout(500);

      // Integration should accept decimal values
      const intValue = await helper.getInputValue(helper.getIntegrationInput(0));
      expect(intValue).toBe('1.5');
    });

    test('should paste multiple rows successfully', async () => {
      const shiftInput = helper.getShiftInput(0);

      // Paste multiple rows
      const tsvData = '7.53	dd	7.5	1.2	1	H-8\n4.5	s			2	CH2\n3.2	d	6.5		3	CH3';
      await shiftInput.click();
      // Dispatch paste event with clipboard data
      await helper.page.evaluate((text) => {
        const input = document.activeElement as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }, tsvData);

      // Wait for paste to complete
      await helper.page.waitForTimeout(300);

      // Verify all rows were pasted
      expect(await helper.getRowCount()).toBe(3);
      expect(await helper.getInputValue(helper.getShiftInput(0))).toBe('7.53');
      expect(await helper.getInputValue(helper.getShiftInput(1))).toBe('4.5');
      expect(await helper.getInputValue(helper.getShiftInput(2))).toBe('3.2');
    });
  });
});
