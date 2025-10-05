"use strict";
// Metadata model for NMR data
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metadata = void 0;
exports.validateNucleiType = validateNucleiType;
exports.validateSolventType = validateSolventType;
const logger_1 = require("../core/logger");
const constants_1 = require("../core/constants");
class Metadata {
    constructor(nuclei = "", solvent = "", frequency = 0) {
        this.nuclei = nuclei;
        this.solvent = solvent;
        this.frequency = frequency;
    }
}
exports.Metadata = Metadata;
// Runtime validation functions
function validateNucleiType(nuclei) {
    if ((0, constants_1.isValidNucleiType)(nuclei)) {
        return nuclei;
    }
    logger_1.Logger.warn(`Invalid nuclei type: ${nuclei}. Falling back to empty string.`);
    return "";
}
function validateSolventType(solvent) {
    if ((0, constants_1.isValidSolventType)(solvent)) {
        return solvent;
    }
    logger_1.Logger.warn(`Invalid solvent type: ${solvent}. Falling back to empty string.`);
    return "";
}
//# sourceMappingURL=Metadata.js.map