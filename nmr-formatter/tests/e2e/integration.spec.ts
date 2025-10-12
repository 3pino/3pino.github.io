import { test, expect } from '@playwright/test';
import { MetadataFormHelper, TableHelper } from '../fixtures/test-helpers';

/**
 * Integration Tests
 * Tests that verify end-to-end workflows across multiple components
 */
test.describe('Integration Tests - Formatted Output', () => {
  let metadataHelper: MetadataFormHelper;
  let tableHelper: TableHelper;

  test.beforeEach(async ({ page }) => {
    metadataHelper = new MetadataFormHelper(page);
    tableHelper = new TableHelper(page);
    await metadataHelper.goto();
  });

  test('sort-order button should auto-update formatted output', async () => {
    // Setup: Enter data in first row (shift = 1)
    const shift1 = tableHelper.getShiftInput(0);
    await shift1.fill('1');

    // Setup: Add second row and enter data (shift = 2)
    await tableHelper.addRow();
    const shift2 = tableHelper.getShiftInput(1);
    await shift2.fill('2');

    // Step 1: Click Generate Text button
    await tableHelper.generateText();
    await tableHelper.page.waitForTimeout(100);

    // Step 2: Get formatted output (initial - should be descending: 2, 1)
    const richTextEditor = tableHelper.page.locator('#rich-text-editor');
    let outputText = await richTextEditor.textContent();
    
    // Verify initial order (descending: larger shift first)
    // Expected format: "δ 2.00, 1.00" (descending order)
    expect(outputText).toContain('2.00');
    expect(outputText).toContain('1.00');
    
    // Verify 2.00 comes before 1.00 in descending order
    const index2 = outputText?.indexOf('2.00') ?? -1;
    const index1 = outputText?.indexOf('1.00') ?? -1;
    expect(index2).toBeLessThan(index1);

    // Step 3: Click sort-order button to toggle to Ascending
    const sortOrderBtn = metadataHelper.sortOrder;
    await sortOrderBtn.click();

    // Wait for formatted output to update
    await tableHelper.page.waitForTimeout(100);

    // Step 4: Get formatted output again (should be ascending: 1, 2)
    outputText = await richTextEditor.textContent();

    // Verify new order (ascending: smaller shift first)
    // Expected format: "δ 1.00, 2.00" (ascending order)
    expect(outputText).toContain('1.00');
    expect(outputText).toContain('2.00');

    // Verify 1.00 comes before 2.00 in ascending order
    const newIndex1 = outputText?.indexOf('1.00') ?? -1;
    const newIndex2 = outputText?.indexOf('2.00') ?? -1;
    expect(newIndex1).toBeLessThan(newIndex2);

    // Step 5: Verify icon changed to up arrow (Ascending)
    const icon = sortOrderBtn.locator('i');
    await expect(icon).toHaveClass(/fi-rr-up/);
  });

  test('sort-order keyboard toggle (Enter) should auto-update formatted output', async () => {
    // Setup: Enter data in two rows
    await tableHelper.getShiftInput(0).fill('3');
    await tableHelper.addRow();
    await tableHelper.getShiftInput(1).fill('1');

    // Generate initial text (descending: 3, 1)
    await tableHelper.generateText();
    await tableHelper.page.waitForTimeout(100);

    const richTextEditor = tableHelper.page.locator('#rich-text-editor');
    let outputText = await richTextEditor.textContent();

    // Verify initial descending order
    const initial3 = outputText?.indexOf('3.00') ?? -1;
    const initial1 = outputText?.indexOf('1.00') ?? -1;
    expect(initial3).toBeLessThan(initial1);

    // Press Enter on sort-order button
    const sortOrderBtn = metadataHelper.sortOrder;
    await sortOrderBtn.focus();
    await sortOrderBtn.press('Enter');
    await tableHelper.page.waitForTimeout(100);

    // Verify order changed to ascending
    outputText = await richTextEditor.textContent();
    const new1 = outputText?.indexOf('1.00') ?? -1;
    const new3 = outputText?.indexOf('3.00') ?? -1;
    expect(new1).toBeLessThan(new3);
  });

  test('sort-order Space key should auto-update formatted output', async () => {
    // Setup: Enter data in two rows
    await tableHelper.getShiftInput(0).fill('5');
    await tableHelper.addRow();
    await tableHelper.getShiftInput(1).fill('2');

    // Generate initial text (descending: 5, 2)
    await tableHelper.generateText();
    await tableHelper.page.waitForTimeout(100);

    const richTextEditor = tableHelper.page.locator('#rich-text-editor');
    let outputText = await richTextEditor.textContent();

    // Verify initial descending order
    const initial5 = outputText?.indexOf('5.00') ?? -1;
    const initial2 = outputText?.indexOf('2.00') ?? -1;
    expect(initial5).toBeLessThan(initial2);

    // Press Space on sort-order button
    const sortOrderBtn = metadataHelper.sortOrder;
    await sortOrderBtn.focus();
    await sortOrderBtn.press(' ');
    await tableHelper.page.waitForTimeout(100);

    // Verify order changed to ascending
    outputText = await richTextEditor.textContent();
    const new2 = outputText?.indexOf('2.00') ?? -1;
    const new5 = outputText?.indexOf('5.00') ?? -1;
    expect(new2).toBeLessThan(new5);
  });
});
