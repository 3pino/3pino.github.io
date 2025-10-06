# NMR Formatter Release Notes

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
