"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("../../wad/string");
// Represents the patch table ("PNAMES") lump.
// Stores the names of all patch lumps in the WAD and its dependencies.
// Normally, a graphic must be represented in PNAMES to be usable in
// TEXTURE1 and TEXTURE2 lumps.
class WADPatches {
    constructor(data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as a patch table.
    // Returns false otherwise.
    static match(lump) {
        return lump.name.toUpperCase() === WADPatches.LumpName && !!(lump.length >= 4 && (lump.length % 8 === 4));
    }
    // Create a WADPatches given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid PNAMES lump.");
        }
        return new WADPatches(lump.data);
    }
    // Get the number of patches in the table.
    get length() {
        return Math.min(Math.floor(this.data.length / 8), this.data.readUInt32LE(0));
    }
    // Get the patch name at an index.
    // Patch names are up to 8 ASCII characters long and should match the
    // names of lumps in this WAD or another loaded WAD.
    getPatchName(patchIndex) {
        if (patchIndex < 0 || patchIndex >= this.length) {
            throw new Error("Patch index out of range.");
        }
        return string_1.readPaddedString8(this.data, 4 + (8 * patchIndex));
    }
    // Enumerate all of the patch names in the lump.
    *enumeratePatchNames() {
        const numPatches = this.length;
        for (let patchIndex = 0; patchIndex < numPatches; patchIndex++) {
            yield string_1.readPaddedString8(this.data, 4 + (8 * patchIndex));
        }
    }
}
exports.WADPatches = WADPatches;
// Patch table lumps are always named "PNAMES".
WADPatches.LumpName = "PNAMES";
exports.default = WADPatches;
//# sourceMappingURL=patches.js.map