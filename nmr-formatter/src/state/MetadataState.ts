/**
 * Metadata State Management
 * Manages nuclei, solvent, frequency, precision, and sort order
 */

export interface MetadataStateData {
    nuclei: string;
    solvent: string;
    frequency: number;
    shiftPrecision: number;
    jPrecision: number;
    sortOrder: 'asc' | 'desc';
}

export class MetadataState {
    private data: MetadataStateData;
    private changeListeners: Array<(data: MetadataStateData) => void> = [];

    constructor(initialData?: Partial<MetadataStateData>) {
        this.data = {
            nuclei: '<sup>1</sup>H',
            solvent: '',
            frequency: NaN,
            shiftPrecision: 3,
            jPrecision: 2,
            sortOrder: 'desc',
            ...initialData
        };
    }

    getData(): MetadataStateData {
        return { ...this.data };
    }

    update(updates: Partial<MetadataStateData>): void {
        this.data = { ...this.data, ...updates };
        this.notifyChange();
    }

    setNuclei(nuclei: string): void {
        this.data.nuclei = nuclei;
        this.notifyChange();
    }

    setSolvent(solvent: string): void {
        this.data.solvent = solvent;
        this.notifyChange();
    }

    setFrequency(frequency: number): void {
        this.data.frequency = frequency;
        this.notifyChange();
    }

    setShiftPrecision(precision: number): void {
        this.data.shiftPrecision = precision;
        this.notifyChange();
    }

    setJPrecision(precision: number): void {
        this.data.jPrecision = precision;
        this.notifyChange();
    }

    setSortOrder(order: 'asc' | 'desc'): void {
        this.data.sortOrder = order;
        this.notifyChange();
    }

    onChange(listener: (data: MetadataStateData) => void): void {
        this.changeListeners.push(listener);
    }

    private notifyChange(): void {
        this.changeListeners.forEach(listener => listener(this.getData()));
    }
}
