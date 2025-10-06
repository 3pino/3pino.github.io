// Core type definitions for NMR data structures

export type NucleiType = "1H" | "2H" | "13C" | "14N" | "15N" | "19F" | "23Na" | "27Al" | "29Si" | "31P" | "";

export type SolventType = "D2O" | "CD3OD" | "CD3CN" | "(CD3)2SO" | "(CD3)2CO" | "C6D6" | "toluene-d8" | "CDCl3" | "CD2Cl2" | "THF-d8" | "";

export interface MetadataInterface {
    nuclei: NucleiType;
    solvent: SolventType;
    frequency: number;
    [key: string]: string | number;
}

export interface ValidationError {
    type: 'global' | 'peak' | 'metadata';
    index?: number;
    field?: string;
    message: string;
}
