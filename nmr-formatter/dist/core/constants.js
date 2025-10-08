"use strict";
// Configuration constants for nuclei and solvents
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOLVENT_CONFIG = exports.NUCLEI_CONFIG = exports.SORT_ORDER_PRESETS = exports.SOLVENT_PRESETS = exports.NUCLEI_PRESETS = void 0;
exports.getNucleiPatterns = getNucleiPatterns;
exports.getSolventPatterns = getSolventPatterns;
exports.extractNucleiFromText = extractNucleiFromText;
exports.extractSolventFromText = extractSolventFromText;
exports.isValidNucleiType = isValidNucleiType;
exports.isValidSolventType = isValidSolventType;
// Nuclei preset configurations
exports.NUCLEI_PRESETS = [
    { id: "1H", displayHTML: "<sup>1</sup>H", pattern: /(¹H|protone?|1H\s+NMR|NMR\s+1H)/i },
    { id: "2H", displayHTML: "<sup>2</sup>H", pattern: /(²H|deuterium|2H\s+NMR|NMR\s+2H)/i },
    { id: "13C", displayHTML: "<sup>13</sup>C", pattern: /(13C|¹³C|carbon)/i },
    { id: "14N", displayHTML: "<sup>14</sup>N", pattern: /(14N|¹⁴N)/i },
    { id: "15N", displayHTML: "<sup>15</sup>N", pattern: /(15N|¹⁵N)/i },
    { id: "19F", displayHTML: "<sup>19</sup>F", pattern: /(19F|¹⁹F)/i },
    { id: "23Na", displayHTML: "<sup>23</sup>Na", pattern: /(23Na|²³Na)/i },
    { id: "27Al", displayHTML: "<sup>27</sup>Al", pattern: /(27Al|²⁷Al)/i },
    { id: "29Si", displayHTML: "<sup>29</sup>Si", pattern: /(29Si|²⁹Si)/i },
    { id: "31P", displayHTML: "<sup>31</sup>P", pattern: /(31P|³¹P)/i }
];
// Solvent preset configurations
exports.SOLVENT_PRESETS = [
    { id: "D2O", displayHTML: "D<sub>2</sub>O", pattern: /([DH][2₂]O|water)/i },
    { id: "CD3OD", displayHTML: "CD<sub>3</sub>OD", pattern: /(C[DH][3₃]O[DH]|methanol)/i },
    { id: "CD3CN", displayHTML: "CD<sub>3</sub>CN", pattern: /(C[DH][3₃]CN|acetonitrile?)/i },
    { id: "(CD3)2SO", displayHTML: "DMSO–<I>d</I><sub>6</sub>", pattern: /(\(C[DH][3₃]\)[2₂]SO|Me[2₂]SO|DMSO)/i },
    { id: "(CD3)2CO", displayHTML: "acetone–<I>d</I><sub>6</sub>", pattern: /(\(C[DH][3₃]\)[2₂]CO|Me[2₂]CO|acetone?)/i },
    { id: "C6D6", displayHTML: "C<sub>6</sub>D<sub>6</sub>", pattern: /(C[6₆][DH][6₆]|benzene?)/i },
    { id: "toluene-d8", displayHTML: "toluene–<i>d</i><sub>8</sub>", pattern: /(toluene?)/i },
    { id: "CDCl3", displayHTML: "CDCl<sub>3</sub>", pattern: /(C[DH]Cl[3₃]|ch?loroform)/i },
    { id: "CD2Cl2", displayHTML: "CD<sub>2</sub>Cl<sub>2</sub>", pattern: /(C[DH][2₂]Cl[2₂]|dich?loromethane?)/i },
    { id: "THF-d8", displayHTML: "THF–<i>d</i><sub>8</sub>", pattern: /(THF|tetrahydrofuran)/i }
];
// Sort order preset configurations
exports.SORT_ORDER_PRESETS = [
    { id: "desc", displayHTML: "Descending (High → Low)", pattern: /desc/i },
    { id: "asc", displayHTML: "Ascending (Low → High)", pattern: /asc/i }
];
// Legacy Record-based configurations (for backward compatibility)
exports.NUCLEI_CONFIG = {
    "1H": /(¹H|protone?|1H\s+NMR|NMR\s+1H)/i,
    "2H": /(²H|deuterium|2H\s+NMR|NMR\s+2H)/i,
    "13C": /(13C|¹³C|carbon)/i,
    "14N": /(14N|¹⁴N)/i,
    "15N": /(15N|¹⁵N)/i,
    "19F": /(19F|¹⁹F)/i,
    "23Na": /(23Na|²³Na)/i,
    "27Al": /(27Al|²⁷Al)/i,
    "29Si": /(29Si|²⁹Si)/i,
    "31P": /(31P|³¹P)/i,
    "": null
};
exports.SOLVENT_CONFIG = {
    "D2O": /([DH][2₂]O|water)/i,
    "CD3OD": /(C[DH][3₃]O[DH]|methanol)/i,
    "CD3CN": /(C[DH][3₃]CN|acetonitrile?)/i,
    "(CD3)2SO": /(\(C[DH][3₃]\)[2₂]SO|Me[2₂]SO|DMSO)/i,
    "(CD3)2CO": /(\(C[DH][3₃]\)[2₂]CO|Me[2₂]CO|acetone?)/i,
    "C6D6": /(C[6₆][DH][6₆]|benzene?)/i,
    "toluene-d8": /(toluene?)/i,
    "CDCl3": /(C[DH]Cl[3₃]|ch?loroform)/i,
    "CD2Cl2": /(C[DH][2₂]Cl[2₂]|dich?loromethane?)/i,
    "THF-d8": /(THF|tetrahydrofuran)/i,
    "": null
};
// Utility functions for pattern access
function getNucleiPatterns() {
    const patterns = {};
    for (const [nuclei, pattern] of Object.entries(exports.NUCLEI_CONFIG)) {
        if (pattern && nuclei !== "") {
            patterns[nuclei] = pattern;
        }
    }
    return patterns;
}
function getSolventPatterns() {
    const patterns = {};
    for (const [solvent, pattern] of Object.entries(exports.SOLVENT_CONFIG)) {
        if (pattern && solvent !== "") {
            patterns[solvent] = pattern;
        }
    }
    return patterns;
}
// Type-safe extraction functions
function extractNucleiFromText(text) {
    for (const [nuclei, pattern] of Object.entries(exports.NUCLEI_CONFIG)) {
        if (pattern && pattern.test(text)) {
            return nuclei;
        }
    }
    return "";
}
function extractSolventFromText(text) {
    for (const [solvent, pattern] of Object.entries(exports.SOLVENT_CONFIG)) {
        if (pattern && pattern.test(text)) {
            return solvent;
        }
    }
    return "";
}
// Type safety validation functions
function isValidNucleiType(value) {
    return Object.keys(exports.NUCLEI_CONFIG).includes(value);
}
function isValidSolventType(value) {
    return Object.keys(exports.SOLVENT_CONFIG).includes(value);
}
//# sourceMappingURL=constants.js.map