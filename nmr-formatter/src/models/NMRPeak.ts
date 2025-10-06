// NMR Peak model

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
}
