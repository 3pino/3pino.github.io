// Metadata model for NMR data

import { MetadataInterface, NucleiType, SolventType } from '../core/types';
import { Logger } from '../core/logger';
import { isValidNucleiType, isValidSolventType } from '../core/constants';

export class Metadata implements MetadataInterface {
    nuclei: NucleiType;
    solvent: SolventType;
    frequency: number;
    [key: string]: string | number;

    constructor(nuclei: NucleiType = "", solvent: SolventType = "", frequency: number = 0) {
        this.nuclei = nuclei;
        this.solvent = solvent;
        this.frequency = frequency;
    }
}

// Runtime validation functions
export function validateNucleiType(nuclei: string): NucleiType {
    if (isValidNucleiType(nuclei)) {
        return nuclei;
    }
    Logger.warn(`Invalid nuclei type: ${nuclei}. Falling back to empty string.`);
    return "";
}

export function validateSolventType(solvent: string): SolventType {
    if (isValidSolventType(solvent)) {
        return solvent;
    }
    Logger.warn(`Invalid solvent type: ${solvent}. Falling back to empty string.`);
    return "";
}
