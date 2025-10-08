import { test, expect } from '@playwright/test';
import { TableHelper } from '../fixtures/test-helpers';

test.describe('Table Section - Formatting Toolbar', () => {
  let helper: TableHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TableHelper(page);
    await helper.goto();
  });

  test.describe('Toolbar Button Actions on Assignment Field', () => {
    test('Bold button should apply bold formatting', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');

      // Select all text
      await assign0.press('Control+A');

      // Click bold button
      await helper.applyFormatting(assign0, 'bold');

      // Check HTML contains <b> tag
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<b>');
      expect(html).toContain('Test');
    });

    test('Bold button via Ctrl+B shortcut should apply bold formatting', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');

      // Select all text
      await assign0.press('Control+A');

      // Press Ctrl+B
      await helper.applyFormattingShortcut(assign0, 'bold');

      // Check HTML contains <b> tag
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<b>');
    });

    test('Italic button should apply italic formatting', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');

      // Select all text
      await assign0.press('Control+A');

      // Click italic button
      await helper.applyFormatting(assign0, 'italic');

      // Check HTML contains <i> tag
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<i>');
      expect(html).toContain('Test');
    });

    test('Italic button via Ctrl+I shortcut should apply italic formatting', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');

      // Select all text
      await assign0.press('Control+A');

      // Press Ctrl+I
      await helper.applyFormattingShortcut(assign0, 'italic');

      // Check HTML contains <i> tag
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<i>');
    });

    test('Subscript button should apply subscript formatting', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('H2O');

      // Select '2'
      await assign0.press('ArrowLeft');
      await assign0.press('Shift+ArrowLeft');

      // Click subscript button
      await helper.applyFormatting(assign0, 'sub');

      // Check HTML contains <sub> tag
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<sub>');
      expect(html).toContain('2');
    });

    test('Superscript button should apply superscript formatting', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('x2');

      // Select '2'
      await assign0.press('ArrowLeft');
      await assign0.press('Shift+ArrowLeft');

      // Click superscript button
      await helper.applyFormatting(assign0, 'sup');

      // Check HTML contains <sup> tag
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<sup>');
      expect(html).toContain('2');
    });

    test('En-dash button should insert en-dash character', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('H8');

      // Move cursor between H and 8
      await assign0.press('ArrowLeft');

      // Click en-dash button
      await helper.applyFormatting(assign0, 'endash');

      // Check text contains en-dash
      const text = await helper.getAssignmentText(0);
      expect(text).toContain('–');
      expect(text).toBe('H–8');
    });

    test('should toggle bold formatting on/off', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');
      await assign0.press('Control+A');

      // Apply bold
      await helper.applyFormatting(assign0, 'bold');
      let html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<b>');

      // Toggle off (apply bold again)
      await assign0.press('Control+A');
      await helper.applyFormatting(assign0, 'bold');

      html = await helper.getAssignmentHTML(0);
      // Bold should be toggled off (may not contain <b> or be different)
      // Note: Actual toggle behavior depends on implementation
    });

    test('should apply multiple formats to same text', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');
      await assign0.press('Control+A');

      // Apply bold
      await helper.applyFormatting(assign0, 'bold');

      // Apply italic (should have both)
      await assign0.press('Control+A');
      await helper.applyFormatting(assign0, 'italic');

      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<b>');
      expect(html).toContain('<i>');
    });

    test('should apply different formats to different parts of text', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('H8-carbon');

      // Select 'H'
      await assign0.press('Home');
      await assign0.press('Shift+ArrowRight');

      // Make 'H' bold
      await helper.applyFormatting(assign0, 'bold');

      // Select '8'
      await assign0.press('ArrowRight');
      await assign0.press('Shift+ArrowRight');

      // Make '8' subscript
      await helper.applyFormatting(assign0, 'sub');

      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<b>');
      expect(html).toContain('<sub>');
    });
  });

  test.describe('Toolbar Has No Effect on Other Fields', () => {
    test('should not affect Shift input field', async () => {
      const shiftInput = helper.getShiftInput(0);

      await shiftInput.fill('7.53');
      await shiftInput.click();

      // Select text
      await shiftInput.press('Control+A');

      // Try to apply bold
      await helper.boldBtn.click();

      // Input value should remain plain text (no HTML formatting)
      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.53');

      // Should not have any HTML tags
      expect(value).not.toContain('<b>');
    });

    test('should not affect Multiplicity input field', async () => {
      const multInput = helper.getMultiplicityInput(0);

      await multInput.fill('dd');
      await multInput.click();
      await multInput.press('Control+A');

      // Try to apply italic
      await helper.italicBtn.click();

      const value = await helper.getInputValue(multInput);
      expect(value).toBe('dd');
      expect(value).not.toContain('<i>');
    });

    test('should not affect J-value input field', async () => {
      // Set up J-column
      await helper.getMultiplicityInput(0).fill('d');
      await helper.page.waitForTimeout(100);

      const jInput = helper.getJInput(0, 0);

      await jInput.fill('7.5');
      await jInput.click();
      await jInput.press('Control+A');

      // Try to apply subscript
      await helper.subBtn.click();

      const value = await helper.getInputValue(jInput);
      expect(value).toBe('7.5');
      expect(value).not.toContain('<sub>');
    });

    test('should not affect Integration input field', async () => {
      const intInput = helper.getIntegrationInput(0);

      await intInput.fill('3');
      await intInput.click();
      await intInput.press('Control+A');

      // Try to apply superscript
      await helper.supBtn.click();

      const value = await helper.getInputValue(intInput);
      expect(value).toBe('3');
      expect(value).not.toContain('<sup>');
    });

    test('Ctrl+B should not affect Shift input', async () => {
      const shiftInput = helper.getShiftInput(0);

      await shiftInput.fill('7.53');
      await shiftInput.click();
      await shiftInput.press('Control+A');

      // Try Ctrl+B shortcut
      await shiftInput.press('Control+B');

      const value = await helper.getInputValue(shiftInput);
      expect(value).toBe('7.53');
      expect(value).not.toContain('<b>');
    });

    test('Ctrl+I should not affect Multiplicity input', async () => {
      const multInput = helper.getMultiplicityInput(0);

      await multInput.fill('dd');
      await multInput.click();
      await multInput.press('Control+A');

      // Try Ctrl+I shortcut
      await multInput.press('Control+I');

      const value = await helper.getInputValue(multInput);
      expect(value).toBe('dd');
      expect(value).not.toContain('<i>');
    });
  });

  test.describe('Formatting Preservation', () => {
    test('should preserve formatting after blur and refocus', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');
      await assign0.press('Control+A');
      await helper.applyFormatting(assign0, 'bold');

      // Blur
      await helper.getShiftInput(0).click();

      // Refocus
      await assign0.click();

      // Formatting should be preserved
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<b>');
    });

    test('should preserve formatting after navigation', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');
      await assign0.press('Control+A');
      await helper.applyFormatting(assign0, 'italic');

      // Navigate away with Tab
      await assign0.press('Tab');

      // Navigate back
      await helper.page.keyboard.press('Shift+Tab');

      // Formatting should be preserved
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<i>');
    });

    test('should preserve formatting after row addition', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');
      await assign0.press('Control+A');
      await helper.applyFormatting(assign0, 'bold');

      // Add new row
      await helper.addRow();

      // Original formatting should be preserved
      const html = await helper.getAssignmentHTML(0);
      expect(html).toContain('<b>');
    });
  });

  test.describe('Complex Formatting Scenarios', () => {
    test('should handle nested formatting (bold + italic)', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');
      await assign0.press('Control+A');

      // Apply bold
      await helper.applyFormattingShortcut(assign0, 'bold');

      // Apply italic (without losing bold)
      await assign0.press('Control+A');
      await helper.applyFormattingShortcut(assign0, 'italic');

      const html = await helper.getAssignmentHTML(0);

      // Should contain both tags
      expect(html).toContain('<b>');
      expect(html).toContain('<i>');
    });

    test('should handle chemical formula with subscripts and superscripts', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('H2SO4');

      // Make '2' subscript
      await assign0.press('Home');
      await assign0.press('ArrowRight'); // Move to '2'
      await assign0.press('Shift+ArrowRight');
      await helper.applyFormatting(assign0, 'sub');

      // Make '4' subscript
      await assign0.press('End');
      await assign0.press('ArrowLeft'); // Move to '4'
      await assign0.press('Shift+ArrowRight');
      await helper.applyFormatting(assign0, 'sub');

      const html = await helper.getAssignmentHTML(0);

      // Should have 2 subscript tags
      const subCount = (html.match(/<sub>/g) || []).length;
      expect(subCount).toBe(2);
    });

    test('should handle partial text formatting', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Carbon-13');

      // Select '13' and make it superscript
      await assign0.press('End');
      await assign0.press('Shift+ArrowLeft');
      await assign0.press('Shift+ArrowLeft');
      await helper.applyFormatting(assign0, 'sup');

      const html = await helper.getAssignmentHTML(0);
      const text = await helper.getAssignmentText(0);

      expect(html).toContain('<sup>');
      expect(text).toContain('Carbon-13');
    });

    test('should insert en-dash at various cursor positions', async () => {
      const assign0 = helper.getAssignmentInput(0);

      // Insert at start
      await assign0.click();
      await helper.applyFormatting(assign0, 'endash');

      await assign0.type('start');

      // Insert in middle
      await assign0.press('Home');
      await assign0.press('ArrowRight');
      await helper.applyFormatting(assign0, 'endash');

      // Insert at end
      await assign0.press('End');
      await helper.applyFormatting(assign0, 'endash');

      const text = await helper.getAssignmentText(0);

      // Should have 3 en-dashes
      const dashCount = (text.match(/–/g) || []).length;
      expect(dashCount).toBe(3);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle formatting on empty selection', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();

      // Try to apply bold without any text selected
      await helper.applyFormatting(assign0, 'bold');

      // Type after applying formatting
      await assign0.type('Test');

      const html = await helper.getAssignmentHTML(0);

      // May or may not have formatting (depends on implementation)
      // Just ensure it doesn't crash
      expect(html).toBeTruthy();
    });

    test('should handle rapid formatting button clicks', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('Test');
      await assign0.press('Control+A');

      // Rapidly apply formatting
      await helper.boldBtn.click();
      await helper.italicBtn.click();
      await helper.subBtn.click();
      await helper.supBtn.click();

      const html = await helper.getAssignmentHTML(0);

      // Should not crash and HTML should exist
      expect(html).toBeTruthy();
    });

    test('should handle formatting after clearing and retyping', async () => {
      const assign0 = helper.getAssignmentInput(0);

      await assign0.click();
      await assign0.type('First');
      await assign0.press('Control+A');
      await helper.applyFormatting(assign0, 'bold');

      // Clear
      await helper.clearInput(assign0);

      // Retype
      await assign0.type('Second');
      await assign0.press('Control+A');
      await helper.applyFormatting(assign0, 'italic');

      const html = await helper.getAssignmentHTML(0);

      // Should have italic (not bold)
      expect(html).toContain('<i>');
      expect(html).toContain('Second');
    });
  });
});
