"use strict";
// Test suite for multipletnumbers() and isJValuesOptional() functions
Object.defineProperty(exports, "__esModule", { value: true });
const NMRPeak_1 = require("./models/NMRPeak");
const multipletnumbers = NMRPeak_1.NMRPeak.multipletnumbers;
const isJValuesOptional = NMRPeak_1.NMRPeak.isJValuesOptional;
const testCases = [
    // Basic single multiplicities
    { input: 's', expected: null, description: 'singlet (abbreviation)' },
    { input: 'singlet', expected: null, description: 'singlet (full word)' },
    { input: 'd', expected: [2], description: 'doublet (abbreviation)' },
    { input: 'doublet', expected: [2], description: 'doublet (full word)' },
    { input: 't', expected: [3], description: 'triplet (abbreviation)' },
    { input: 'triplet', expected: [3], description: 'triplet (full word)' },
    { input: 'q', expected: [4], description: 'quartet (abbreviation)' },
    { input: 'quartet', expected: [4], description: 'quartet (full word)' },
    { input: 'quint', expected: [5], description: 'quintet (abbreviation)' },
    { input: 'quintet', expected: [5], description: 'quintet (full word)' },
    { input: 'sext', expected: [6], description: 'sextet (abbreviation)' },
    { input: 'sextet', expected: [6], description: 'sextet (full word)' },
    { input: 'sept', expected: [7], description: 'septet (abbreviation)' },
    { input: 'septet', expected: [7], description: 'septet (full word)' },
    { input: 'oct', expected: [8], description: 'octet (abbreviation)' },
    { input: 'octet', expected: [8], description: 'octet (full word)' },
    { input: 'non', expected: [9], description: 'nonet (abbreviation)' },
    { input: 'nonet', expected: [9], description: 'nonet (full word)' },
    // Multiplet and broad
    { input: 'm', expected: null, description: 'multiplet (abbreviation)' },
    { input: 'multiplet', expected: null, description: 'multiplet (full word)' },
    { input: 'br', expected: null, description: 'broad (abbreviation)' },
    { input: 'broad', expected: null, description: 'broad (full word)' },
    // Broad combinations (NEW TEST CASES)
    { input: 'br s', expected: null, description: 'broad singlet' },
    { input: 'bs', expected: null, description: 'broad singlet (compact)' },
    { input: 'br d', expected: [2], description: 'broad doublet' },
    { input: 'bd', expected: [2], description: 'broad doublet (compact)' },
    { input: 'broad triplet', expected: [3], description: 'broad triplet (full words)' },
    // Compound multiplicities (abbreviations)
    { input: 'dd', expected: [2, 2], description: 'doublet of doublets' },
    { input: 'dt', expected: [2, 3], description: 'doublet of triplets' },
    { input: 'td', expected: [3, 2], description: 'triplet of doublets' },
    { input: 'tt', expected: [3, 3], description: 'triplet of triplets (NEW)' },
    { input: 'ddd', expected: [2, 2, 2], description: 'doublet of doublet of doublets' },
    { input: 'ddt', expected: [2, 2, 3], description: 'doublet of doublet of triplets' },
    { input: 'dtd', expected: [2, 3, 2], description: 'doublet of triplet of doublets' },
    // Compound multiplicities (full words with "of")
    { input: 'doublet of doublets', expected: [2, 2], description: 'doublet of doublets (full words)' },
    { input: 'doublet of triplets', expected: [2, 3], description: 'doublet of triplets (full words)' },
    { input: 'triplet of doublets', expected: [3, 2], description: 'triplet of doublets (full words)' },
    // Parentheses cases (NEW TEST CASES)
    { input: 'm (tt)', expected: [3, 3], description: 'multiplet with triplet of triplets in parentheses' },
    { input: 'm (dt)', expected: [2, 3], description: 'multiplet with doublet of triplets in parentheses' },
    // Hyphen/dash variations
    { input: 'doublet-of-triplets', expected: [2, 3], description: 'doublet of triplets (hyphens)' },
    { input: 'd-t', expected: [2, 3], description: 'doublet of triplets (hyphen abbreviation)' },
    { input: 'd–t', expected: [2, 3], description: 'doublet of triplets (en dash)' },
    // Multiplet + other multiplicity (allowed)
    { input: 'md', expected: [2], description: 'multiplet + doublet (allowed)' },
    { input: 'mt', expected: [3], description: 'multiplet + triplet (allowed)' },
    { input: 'm d', expected: [2], description: 'multiplet doublet with space (allowed)' },
    // Plural variations
    { input: 'doublets', expected: [2], description: 'doublets (plural)' },
    { input: 'triplets', expected: [3], description: 'triplets (plural)' },
    { input: 'singlets', expected: null, description: 'singlets (plural)' },
    { input: 'multiplets', expected: null, description: 'multiplets (plural)' },
];
const errorTestCases = [
    // Invalid: multiple s/m
    { input: 'ss', description: 'double singlet (invalid)' },
    { input: 'mm', description: 'double multiplet (invalid)' },
    { input: 'singlet singlet', description: 'singlet singlet (full words, invalid)' },
    { input: 'multiplet multiplet', description: 'multiplet multiplet (full words, invalid)' },
    // Invalid: s/m mixed with other multiplicities
    { input: 'sd', description: 'singlet + doublet (invalid)' },
    { input: 'ms', description: 'multiplet + singlet (invalid)' },
    { input: 'sm', description: 'singlet + multiplet (invalid)' },
    { input: 'ds', description: 'doublet + singlet (invalid)' },
    { input: 'tm', description: 'triplet + multiplet (invalid)' },
    { input: 'doublet singlet', description: 'doublet singlet (full words, invalid)' },
    { input: 'singlet of doublet', description: 'singlet of doublet (full words, invalid)' },
];
function runTests() {
    console.log('=== Testing multipletnumbers() function ===\n');
    let passed = 0;
    let failed = 0;
    testCases.forEach((testCase, index) => {
        try {
            const result = multipletnumbers(testCase.input);
            const resultStr = result === null ? 'null' : `[${result.join(', ')}]`;
            const expectedStr = testCase.expected === null ? 'null' : `[${testCase.expected.join(', ')}]`;
            const isMatch = JSON.stringify(result) === JSON.stringify(testCase.expected);
            if (isMatch) {
                console.log(`✅ Test ${index + 1}: PASS - "${testCase.input}" → ${resultStr}`);
                console.log(`   (${testCase.description})`);
                passed++;
            }
            else {
                console.log(`❌ Test ${index + 1}: FAIL - "${testCase.input}"`);
                console.log(`   Expected: ${expectedStr}`);
                console.log(`   Got:      ${resultStr}`);
                console.log(`   (${testCase.description})`);
                failed++;
            }
        }
        catch (error) {
            console.log(`❌ Test ${index + 1}: ERROR - "${testCase.input}"`);
            console.log(`   ${error.message}`);
            console.log(`   (${testCase.description})`);
            failed++;
        }
        console.log('');
    });
    console.log(`\n=== Test Summary ===`);
    console.log(`Total: ${testCases.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
}
function runErrorTests() {
    console.log('\n=== Testing Error Cases ===\n');
    let passed = 0;
    let failed = 0;
    errorTestCases.forEach((testCase, index) => {
        try {
            const result = multipletnumbers(testCase.input);
            // If we get here, it means no error was thrown - test failed
            const resultStr = result === null ? 'null' : `[${result.join(', ')}]`;
            console.log(`❌ Test ${index + 1}: FAIL - "${testCase.input}"`);
            console.log(`   Expected: Error`);
            console.log(`   Got:      ${resultStr} (no error thrown)`);
            console.log(`   (${testCase.description})`);
            failed++;
        }
        catch (error) {
            // Error was thrown as expected - test passed
            console.log(`✅ Test ${index + 1}: PASS - "${testCase.input}" → Error thrown`);
            console.log(`   Error: ${error.message}`);
            console.log(`   (${testCase.description})`);
            passed++;
        }
        console.log('');
    });
    console.log(`\n=== Error Test Summary ===`);
    console.log(`Total: ${errorTestCases.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / errorTestCases.length) * 100).toFixed(1)}%`);
}
const optionalTestCases = [
    // Not optional (regular multiplicities without m/br/broad)
    { input: 's', expectedOptional: false, description: 'singlet - not optional' },
    { input: 'd', expectedOptional: false, description: 'doublet - not optional' },
    { input: 'dt', expectedOptional: false, description: 'doublet of triplets - not optional' },
    { input: 'ddd', expectedOptional: false, description: 'doublet of doublet of doublets - not optional' },
    // Not optional (m/br/broad ALONE - J-values must be 0)
    { input: 'm', expectedOptional: false, description: 'multiplet alone - J must be 0' },
    { input: 'multiplet', expectedOptional: false, description: 'multiplet (full) alone - J must be 0' },
    { input: 'br', expectedOptional: false, description: 'broad alone - J must be 0' },
    { input: 'broad', expectedOptional: false, description: 'broad (full) alone - J must be 0' },
    { input: 'br s', expectedOptional: false, description: 'broad singlet - J must be 0' },
    { input: 'bs', expectedOptional: false, description: 'broad singlet (compact) - J must be 0' },
    { input: 'br d', expectedOptional: true, description: 'broad doublet - optional' },
    { input: 'bd', expectedOptional: true, description: 'broad doublet (compact) - optional' },
    { input: 'broad triplet', expectedOptional: true, description: 'broad triplet - optional' },
    { input: 'm (tt)', expectedOptional: true, description: 'multiplet with tt - optional' },
    { input: 'm (dt)', expectedOptional: true, description: 'multiplet with dt - optional' },
    { input: 'm(dd)', expectedOptional: true, description: 'multiplet with dd (no space) - optional' },
];
function runOptionalTests() {
    console.log('\n=== Testing isJValuesOptional() function ===\n');
    let passed = 0;
    let failed = 0;
    optionalTestCases.forEach((testCase, index) => {
        try {
            const result = isJValuesOptional(testCase.input);
            const resultStr = result ? 'optional' : 'required';
            const expectedStr = testCase.expectedOptional ? 'optional' : 'required';
            const isMatch = result === testCase.expectedOptional;
            if (isMatch) {
                console.log(`✅ Test ${index + 1}: PASS - "${testCase.input}" → ${resultStr}`);
                console.log(`   (${testCase.description})`);
                passed++;
            }
            else {
                console.log(`❌ Test ${index + 1}: FAIL - "${testCase.input}"`);
                console.log(`   Expected: ${expectedStr}`);
                console.log(`   Got:      ${resultStr}`);
                console.log(`   (${testCase.description})`);
                failed++;
            }
        }
        catch (error) {
            console.log(`❌ Test ${index + 1}: ERROR - "${testCase.input}"`);
            console.log(`   ${error.message}`);
            console.log(`   (${testCase.description})`);
            failed++;
        }
        console.log('');
    });
    console.log(`\n=== Optional Test Summary ===`);
    console.log(`Total: ${optionalTestCases.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / optionalTestCases.length) * 100).toFixed(1)}%`);
}
// Run tests
runTests();
runErrorTests();
runOptionalTests();
//# sourceMappingURL=test-multiplicity.js.map