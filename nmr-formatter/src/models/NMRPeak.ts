// NMR Peak model

import { ValidationError } from '../core/types';

export class NMRPeak {
    chemicalShift: number | [number, number];
    multiplicity: string;
    jValues: number[];
    integration: number | string;
    assignment: string;

    constructor(
        chemicalShift: number | [number, number] = 0,
        multiplicity: string = "",
        jValues: number[] = [],
        integration: number | string = 0,
        assignment: string = ""
    ) {
        this.chemicalShift = chemicalShift;
        this.multiplicity = multiplicity;
        this.jValues = jValues;
        this.integration = integration;
        this.assignment = assignment;
    }

    // Convenience getter/setter for compatibility with app.js
    get shift(): number {
        return typeof this.chemicalShift === 'number' ? this.chemicalShift : this.chemicalShift[0];
    }

    set shift(value: number) {
        this.chemicalShift = value;
    }

    /**
     * Get expected number of J-values based on multiplicity
     * Returns null for singlet(s), multiplet(m), or broad(br)
     * Returns array of expected J-value counts for compound multiplicities (e.g., dt -> [2,3])
     */
    static multipletnumbers(multiplicityText: string): number[] | null {
        const clean = multiplicityText.toLowerCase().trim();
        let normalized = clean;

        const replacementMap: [RegExp, string][] = [
            [/\s+of\s+/g, ' '],
            [/[\s\-–()]+/g, ' '],
            [/broad\s*/g, ''],
            [/br\s*/g, ''],

            // Full words - keep s and m
            [/nonets?/g, '9'],
            [/octets?/g, '8'],
            [/septets?/g, '7'],
            [/sextets?/g, '6'],
            [/quintets?/g, '5'],
            [/quartets?/g, '4'],
            [/triplets?/g, '3'],
            [/doublets?/g, '2'],
            [/singlets?/g, '1'],
            [/multiplets?/g, 'm'],

            // Abbreviations - keep s and m
            [/non(?!et)/g, '9'],
            [/oct(?!et)/g, '8'],
            [/sept(?!et)/g, '7'],
            [/sext(?!et)/g, '6'],
            [/quint(?!et)/g, '5'],
            [/q(?!u)/g, '4'],
            [/t(?!r|e)/g, '3'],
            [/d(?!o)/g, '2'],
            [/s(?!i)/g, '1'],
            [/m(?!u)/g, 'm'],
            [/b(?!r|o)/g, ''],

            [/\s+/g, ''],
        ];

        replacementMap.forEach(([pattern, replacement]) => {
            normalized = normalized.replace(pattern, replacement);
        });

        normalized = normalized.trim();

        // Validate s/m combinations
        if (/1/.test(normalized) || /m/.test(normalized)) {
            // Check for invalid s patterns
            if (/[1m][1m]/.test(normalized)) {
                throw new Error(`Invalid multiplicity combination: "${multiplicityText}" (multiple s / m)`);
            }
            if (/1\d|\d1/.test(normalized)) {
                throw new Error(`Invalid multiplicity combination: "${multiplicityText}" (s cannot combine with other multiplicities)`);
            }

            // Check for invalid m patterns
            if (/\dm/.test(normalized)) {
                throw new Error(`Invalid multiplicity combination: "${multiplicityText}" (m must be at the beginning)`);
            }

            // Single s or m is OK
            if (normalized === '1' || normalized === 'm') {
                return null;
            }

            // m + digits is OK (e.g., "m23" from "m(dt)")
            if (/^m\d+$/.test(normalized)) {
                const digits = normalized.match(/\d/g);
                if (digits && digits.length > 0) {
                    return digits.map(d => parseInt(d, 10));
                }
            }

            // If we reach here, it's an invalid s/m combination
            throw new Error(`Invalid multiplicity combination: "${multiplicityText}"`);
        }

        if (normalized === '') return null;

        const digits = normalized.match(/\d/g);
        if (digits && digits.length > 0) {
            return digits.map(d => parseInt(d, 10));
        }

        throw new Error(`Unhandled multiplicity format: "${multiplicityText}"`);
    }

    /**
     * Check if J-values are optional for a given multiplicity
     * Returns true if multiplicity contains 'm', 'br', or 'broad' (e.g., "m(tt)", "br d", "bs")
     */
    static isJValuesOptional(multiplicityText: string): boolean {
        const clean = multiplicityText.toLowerCase().trim();

        // Check if contains m/br/broad
        const hasBroadOrMultiplet = /\b(m|multiplet|br|broad)\b|^b/.test(clean);

        if (!hasBroadOrMultiplet) {
            return false; // No m/br/broad → not optional
        }

        // If it's ONLY m/br/broad (no other multiplicity), return false
        // because J-values must be 0 (handled by multipletnumbers returning null)
        const jCounts = NMRPeak.multipletnumbers(multiplicityText);
        if (jCounts === null) {
            return false; // Only m/br/broad → J-values must be 0, not optional
        }

        // Has both m/br/broad AND other multiplicity → optional
        return true;
    }

    /**
     * Validate this peak's J-value count against multiplicity
     */
    validate(): ValidationError[] {
        const errors: ValidationError[] = [];

        // Validate Integration: must be >= 0.5
        if (this.integration !== null && this.integration !== '') {
            const integrationValue = typeof this.integration === 'string'
                ? parseFloat(this.integration)
                : this.integration;

            if (!isNaN(integrationValue) && integrationValue < 0.5) {
                errors.push({
                    type: 'peak',
                    index: 0,
                    field: 'integration',
                    message: `Integration must be at least 0.5, but found ${integrationValue}`
                });
            }
        }

        if (this.multiplicity) {
            try {
                const expectedJCounts = NMRPeak.multipletnumbers(this.multiplicity);
                if (expectedJCounts !== null) {
                    const actualJCount = this.jValues.filter((j: number) => !isNaN(j) && j > 0).length;
                    const expectedTotal = expectedJCounts.length;

                    // Check if J-values are optional (e.g., "m(tt)", "br d")
                    const isOptional = NMRPeak.isJValuesOptional(this.multiplicity);

                    // If optional: allow 0 or expectedTotal J-values
                    // If not optional: must have exactly expectedTotal J-values
                    if (!isOptional && actualJCount !== expectedTotal) {
                        errors.push({
                            type: 'peak',
                            index: 0,
                            field: 'jcount',
                            message: `Multiplicity "${this.multiplicity}" expects ${expectedTotal} J-values, but found ${actualJCount}`
                        });
                    } else if (isOptional && actualJCount !== 0 && actualJCount !== expectedTotal) {
                        errors.push({
                            type: 'peak',
                            index: 0,
                            field: 'jcount',
                            message: `Multiplicity "${this.multiplicity}" expects 0 or ${expectedTotal} J-values, but found ${actualJCount}`
                        });
                    }
                }
            } catch (error) {
                // Invalid multiplicity format - ignore as it's not our concern
            }
        }

        return errors;
    }
}
