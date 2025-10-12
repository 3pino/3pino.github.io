# NMR Formatter Release Notes

## ver 1.3.1 (2025-10-12)

### Bug Fixes

**Table Functionality:**
- Fixed J-column calculation for multiplicities 6-9 (sextet, septet, octet, nonet)

## ver 1.3 (2025-10-12)

### UI/UX Improvements

**Layout and Design:**
- Unified toolbar and metadata sections for cleaner interface
- Reorganized metadata fields with improved grouping
- Updated icon font for modern, consistent look

**Table Enhancements:**
- Replaced "Add Peak" button with inline '+' cell for intuitive row addition
- Sort order control now uses icon toggle button instead of dropdown
- Automatic output update when sort order changes
- Improved add-row footer behavior with dynamic column adjustment

**Keyboard Navigation:**
- Enhanced metadata form navigation with group-based focus
- Fixed navigation issues in numeric fields
- Improved keyboard navigation consistency across the table
- Better Enter key handling throughout the application

**Validation and Data Entry:**
- Improved validation error state management
- Enhanced J-value sorting behavior (triggered on Generate Text)
- Fixed numeric field handling and removed confusing default values
- Better focus management in input fields

## ver 1.2 (2025-10-07)

### Precision and Input Handling Improvements

**Significant Figures:**
- Changed from fixed precision to significant figures for chemical shift and J-values
- More accurate representation of measurement precision
- Updated UI labels to reflect "Shift Sig. Figs." and "J Sig. Figs."

**UI/UX Enhancements:**
- Improved metadata input field behavior
- Fixed Enter key behavior to prevent unwanted line breaks in input fields
- Fixed empty value handling in assignment field (removes placeholder, prevents extra commas/newlines)

## ver 1.1 (2025-10-06)

### Enhanced Multiplicity Support

**Extended Multiplicity Types:**
- Added support for sextet (6), septet (7), octet (8), nonet (9)
- Both abbreviations (sext, sept, oct, non) and full words (sextet, septet, octet, nonet) are supported
- Support for broad + multiplicity patterns: `br s`, `bs`, `br d`, `bd`, `broad triplet`
- Support for multiplet with parentheses: `m(tt)`, `m(dt)`, `m(dd)`

**Invalid Pattern Detection:**
- Detects and rejects invalid combinations:
  - Multiple singlet/multiplet: `ss`, `mm`, `sm`, `ms`
  - Singlet + other multiplicities: `sd`, `ds`
  - Multiplet in wrong position: `tm`, `dtm`
- Clear error messages for invalid patterns (Devtools)

## ver 1.0 (2025-10-06)
Initial release
