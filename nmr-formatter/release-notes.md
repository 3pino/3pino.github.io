# NMR Formatter Release Notes

## ver 1.4.2 (2025-10-18)

### UI/UX Improvements

- Tried to hide `3pino` in release-notes.html

## ver 1.4.1 (2025-10-18)

### UI/UX Improvements

- Limited chemical shift precision to 5 significant figures in TopSpin import

### Bug Fixes

- Fixed drag-drop overlay being hidden by scrolled table container
- Fixed multiplicity '1' now properly treated as singlet (disables J-value editing)

### Minor Changes

- Minor changes in release-notes.md

## ver 1.4 (2025-10-17)

### ✨TopSpin Data Drag & Drop Support

You can now import TopSpin NMR data simply by dragging and dropping the entire folder.

### UI/UX Improvements

- Enhanced numerical precision for J-values and frequency display
- Round J-value calculations to 5 decimal places

### Bug Fixes

-Fix frequency display rounded to integer in formatted output
- Filter out peaks with integration < 0.5 from generated text

## ver 1.3.3 (2025-10-17)

### UI/UX Enhancements

- Added drag-and-drop file import UI with error notifications
- Enhanced user experience for file imports

### Validation

- Added minimum integration value validation
- Added input filtering for chemical shift field
- Extracted validation logic into dedicated validators module

## ver 1.3.2 (2025-10-13)

### UI/UX Improvements

- Fixed page layout to prevent vertical overflow
- Changed app container from min-height to fixed height (100vh)
- Made table section independently scrollable
- Set rich text editor to max 30vh height with internal scrolling
- Added favicon support with ICO and SVG formats
- Better visual identity for the application

## ver 1.3.1 (2025-10-12)

### Bug Fixes

**Table Functionality:**
- Fixed J-column calculation for multiplicities 6-9 (sextet, septet, octet, nonet)

## ver 1.3 (2025-10-12)

### Layout and Design Improvements

- Unified toolbar and metadata sections for cleaner interface
- Reorganized metadata fields with improved grouping
- Updated icon font for modern, consistent look

### Table Enhancements

- Replaced "Add Peak" button with inline '+' cell for intuitive row addition
- Sort order control now uses icon toggle button instead of dropdown
- Automatic output update when sort order changes
- Improved add-row footer behavior with dynamic column adjustment

### Enhanced Keyboard Navigation

- Enhanced metadata form navigation with group-based focus
- Fixed navigation issues in numeric fields
- Improved keyboard navigation consistency across the table
- Better Enter key handling throughout the application

### Validation and Data Entry Improvements

- Improved validation error state management
- Enhanced J-value sorting behavior (triggered on Generate Text)
- Fixed numeric field handling and removed confusing default values
- Better focus management in input fields

## ver 1.2 (2025-10-07)

### Precision and Input Handling Improvements

- Changed from fixed precision to significant figures for chemical shift and J-values
- Updated UI labels to reflect "Shift Sig. Figs." and "J Sig. Figs."

### UI/UX Enhancements

- Improved metadata input field behavior
- Fixed Enter key behavior to prevent unwanted line breaks in input fields
- Fixed empty value handling in assignment field (removes placeholder, prevents extra commas/newlines)

## ver 1.1 (2025-10-06)

### Enhanced Multiplicity Support

- Added support for sextet (6), septet (7), octet (8), nonet (9)
- Support for broad + multiplicity patterns: `br s`, `bs`, `br d`, `bd`, `broad triplet`
- Support for multiplet with parentheses: `m(tt)`, `m(dt)`, `m(dd)`
- Detects and rejects invalid combinations like `ss`

## ver 1.0 (2025-10-06)
Initial release



<style>
body>div.markdown-body>h1:first-child:has(>a){
  display:none;
}
</style>