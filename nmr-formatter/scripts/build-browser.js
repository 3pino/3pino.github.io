#!/usr/bin/env node
/**
 * Build script to generate browser-compatible bundle from compiled TypeScript files
 * This script reads the compiled JS files from dist/ and creates a single browser.js bundle
 * that exports all necessary classes and functions to the window object
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(distDir, 'browser.js');

// Read compiled files - Core and Models
const loggerCode = fs.readFileSync(path.join(distDir, 'core', 'logger.js'), 'utf8');
const constantsCode = fs.readFileSync(path.join(distDir, 'core', 'constants.js'), 'utf8');
const metadataCode = fs.readFileSync(path.join(distDir, 'models', 'Metadata.js'), 'utf8');
const nmrPeakCode = fs.readFileSync(path.join(distDir, 'models', 'NMRPeak.js'), 'utf8');
const nmrDataCode = fs.readFileSync(path.join(distDir, 'models', 'NMRData.js'), 'utf8');
const conversionCode = fs.readFileSync(path.join(distDir, 'utils', 'conversion.js'), 'utf8');
const sortingCode = fs.readFileSync(path.join(distDir, 'utils', 'sorting.js'), 'utf8');
const formValidationCode = fs.readFileSync(path.join(distDir, 'utils', 'form-validation.js'), 'utf8');
const formatterCode = fs.readFileSync(path.join(distDir, 'utils', 'formatter.js'), 'utf8');
const tsvParserCode = fs.readFileSync(path.join(distDir, 'utils', 'tsv-parser.js'), 'utf8');

// Read Validators files
const inputFiltersCode = fs.readFileSync(path.join(distDir, 'utils', 'validators', 'input-filters.js'), 'utf8');
const fieldValidatorsCode = fs.readFileSync(path.join(distDir, 'utils', 'validators', 'field-validators.js'), 'utf8');

// Read State Management files
const metadataStateCode = fs.readFileSync(path.join(distDir, 'state', 'MetadataState.js'), 'utf8');
const tableStateCode = fs.readFileSync(path.join(distDir, 'state', 'TableState.js'), 'utf8');
const validationStateCode = fs.readFileSync(path.join(distDir, 'state', 'ValidationState.js'), 'utf8');
const appStateCode = fs.readFileSync(path.join(distDir, 'state', 'AppState.js'), 'utf8');

// Read UI Component files
const metadataFormCode = fs.readFileSync(path.join(distDir, 'ui', 'components', 'MetadataForm.js'), 'utf8');
const nmrTableCode = fs.readFileSync(path.join(distDir, 'ui', 'components', 'NMRTable.js'), 'utf8');
const richTextEditorCode = fs.readFileSync(path.join(distDir, 'ui', 'components', 'RichTextEditor.js'), 'utf8');
const toolbarCode = fs.readFileSync(path.join(distDir, 'ui', 'components', 'Toolbar.js'), 'utf8');

// Read Navigation files
const focusManagerCode = fs.readFileSync(path.join(distDir, 'ui', 'navigation', 'FocusManager.js'), 'utf8');
const keyboardNavCode = fs.readFileSync(path.join(distDir, 'ui', 'navigation', 'KeyboardNav.js'), 'utf8');

// Read main App file
const appCode = fs.readFileSync(path.join(distDir, 'ui', 'App.js'), 'utf8');

// Convert CommonJS module to browser-compatible code
function convertToBrowserCode(code) {
    // Remove "use strict"
    code = code.replace(/"use strict";?\n?/g, '');

    // Remove Object.defineProperty for exports
    code = code.replace(/Object\.defineProperty\(exports,\s*"__esModule",\s*\{\s*value:\s*true\s*\}\);?\n?/g, '');

    // Remove complete void 0 declaration lines (e.g., exports.A = exports.B = void 0;)
    code = code.replace(/^exports\.\w+(\s*=\s*exports\.\w+)*\s*=\s*void 0;?\n?/gm, '');

    // Remove standalone function export declarations (e.g., exports.funcName = funcName;)
    code = code.replace(/^exports\.\w+\s*=\s*\w+;?\n?/gm, '');

    // Replace remaining exports.XXX = value patterns with const XXX = value
    code = code.replace(/^exports\.(\w+)\s*=\s*/gm, 'const $1 = ');

    // Fix enum assignments - e.g., (LogLevel || (exports.LogLevel = LogLevel = {}))
    code = code.replace(/\((\w+) \|\| \(exports\.\w+ = \1 = \{\}\)\)/g, '($1 || ($1 = {}))');

    // Fix references to exports in Object.entries and similar patterns
    code = code.replace(/Object\.entries\(exports\.(\w+)\)/g, 'Object.entries($1)');
    code = code.replace(/Object\.keys\(exports\.(\w+)\)/g, 'Object.keys($1)');

    // Fix function calls with exports - e.g., (0, constants_1.isValidNucleiType)
    code = code.replace(/\(0,\s*\w+_\d+\.(\w+)\)/g, '$1');

    // Remove require statements with numbered imports
    code = code.replace(/const \w+_\d+ = require\(["'].*?["']\);?\n?/g, '');
    code = code.replace(/var \w+_\d+ = require\(["'].*?["']\);?\n?/g, '');

    // Remove regular require statements
    code = code.replace(/const \w+ = require\(["'].*?["']\);?\n?/g, '');
    code = code.replace(/var \w+ = require\(["'].*?["']\);?\n?/g, '');

    // Fix references to imported classes - e.g., new Metadata_1.Metadata()
    code = code.replace(/new \w+_\d+\.(\w+)\(/g, 'new $1(');

    // Fix logger references - e.g., logger_1.Logger.warn
    code = code.replace(/\w+_\d+\.Logger\./g, 'Logger.');

    // Fix all module references - e.g., input_filters_1.filterNumericInput -> filterNumericInput
    code = code.replace(/\w+_\d+\.(\w+)/g, '$1');

    // Remove source map comments
    code = code.replace(/\/\/# sourceMappingURL=.*\n?/g, '');

    return code.trim();
}

// Build browser bundle
const browserBundle = `// Browser-compatible bundle for NMR Formatter
// Auto-generated by scripts/build-browser.js
// DO NOT EDIT THIS FILE MANUALLY - It will be overwritten on build

// ========== CORE & MODELS ==========
${convertToBrowserCode(loggerCode)}

${convertToBrowserCode(constantsCode)}

${convertToBrowserCode(metadataCode)}

${convertToBrowserCode(nmrPeakCode)}

${convertToBrowserCode(nmrDataCode)}

${convertToBrowserCode(conversionCode)}

${convertToBrowserCode(sortingCode)}

${convertToBrowserCode(formValidationCode)}

${convertToBrowserCode(formatterCode)}

${convertToBrowserCode(tsvParserCode)}

// ========== VALIDATORS ==========
${convertToBrowserCode(inputFiltersCode)}

${convertToBrowserCode(fieldValidatorsCode)}

// ========== STATE MANAGEMENT ==========
${convertToBrowserCode(metadataStateCode)}

${convertToBrowserCode(tableStateCode)}

${convertToBrowserCode(validationStateCode)}

${convertToBrowserCode(appStateCode)}

// ========== UI COMPONENTS ==========
${convertToBrowserCode(metadataFormCode)}

${convertToBrowserCode(nmrTableCode)}

${convertToBrowserCode(richTextEditorCode)}

${convertToBrowserCode(toolbarCode)}

// ========== NAVIGATION ==========
${convertToBrowserCode(focusManagerCode)}

${convertToBrowserCode(keyboardNavCode)}

// ========== MAIN APPLICATION ==========
${convertToBrowserCode(appCode)}

// Export to window object for browser usage (legacy support)
window.Logger = Logger;
window.LogLevel = LogLevel;
window.NUCLEI_PRESETS = NUCLEI_PRESETS;
window.SOLVENT_PRESETS = SOLVENT_PRESETS;
window.SORT_ORDER_PRESETS = SORT_ORDER_PRESETS;
window.NUCLEI_CONFIG = NUCLEI_CONFIG;
window.SOLVENT_CONFIG = SOLVENT_CONFIG;
window.getNucleiPatterns = getNucleiPatterns;
window.getSolventPatterns = getSolventPatterns;
window.extractNucleiFromText = extractNucleiFromText;
window.extractSolventFromText = extractSolventFromText;
window.isValidNucleiType = isValidNucleiType;
window.isValidSolventType = isValidSolventType;
window.Metadata = Metadata;
window.NMRPeak = NMRPeak;
window.NMRData = NMRData;
window.multipletnumbers = NMRPeak.multipletnumbers;
window.formatChemicalShift = formatChemicalShift;
window.formatJValues = formatJValues;
window.formatIntegration = formatIntegration;
window.formatMultiplicity = formatMultiplicity;
window.formatAssignment = formatAssignment;
window.formatSinglePeak = formatSinglePeak;
window.formatMetadata = formatMetadata;
window.generateFormattedText = generateFormattedText;
window.isJValuesOptional = NMRPeak.isJValuesOptional;

// Export new classes (State Management & UI)
window.MetadataState = MetadataState;
window.TableState = TableState;
window.ValidationState = ValidationState;
window.AppState = AppState;
window.MetadataForm = MetadataForm;
window.NMRTable = NMRTable;
window.RichTextEditor = RichTextEditor;
window.Toolbar = Toolbar;
window.FocusManager = FocusManager;
window.KeyboardNav = KeyboardNav;
window.NMRFormatterApp = NMRFormatterApp;

// Export TSV Parser utilities
window.isTSVData = isTSVData;
window.parseTSV = parseTSV;

console.log('NMR Formatter browser bundle loaded (TypeScript refactored version)');
`;

// Write browser bundle
fs.writeFileSync(outputFile, browserBundle, 'utf8');
console.log(`✓ Browser bundle generated: ${outputFile}`);
