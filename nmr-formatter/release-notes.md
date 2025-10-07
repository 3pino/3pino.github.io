# NMR Formatter Release Notes

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
