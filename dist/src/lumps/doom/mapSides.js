"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("../../wad/string");
// Represents a single sidedef read from a Doom format SIDEDEFS lump.
class WADMapSide {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.upper = options.upper;
        this.lower = options.lower;
        this.middle = options.middle;
        this.sector = options.sector;
    }
}
exports.WADMapSide = WADMapSide;
// Represents a Doom format "SIDEDEFS" lump.
// See: https://doomwiki.org/wiki/Sidedef
class WADMapSides {
    constructor(name, data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as map sidedefs.
    // Returns false otherwise.
    static match(lump) {
        return lump.length % WADMapSides.ItemSize === 0 && (lump.name.toUpperCase() === WADMapSides.LumpName);
    }
    // Create a WADMapSides given a WADLump object.
    static from(lump) {
        return new WADMapSides(lump.name, lump.data);
    }
    // Get the number of sidedefs represented in the lump.
    get length() {
        return Math.floor(this.data.length / WADMapSides.ItemSize);
    }
    // Get the sidedef at an index.
    getSide(lineIndex) {
        if (lineIndex < 0 || lineIndex >= this.length) {
            throw new Error("Sidedef index out of bounds.");
        }
        const sideOffset = WADMapSides.ItemSize * lineIndex;
        return new WADMapSide({
            x: this.data.readInt16LE(sideOffset),
            y: this.data.readInt16LE(sideOffset + 2),
            upper: string_1.readPaddedString8(this.data, sideOffset + 4),
            lower: string_1.readPaddedString8(this.data, sideOffset + 12),
            middle: string_1.readPaddedString8(this.data, sideOffset + 20),
            sector: this.data.readUInt16LE(sideOffset + 28),
        });
    }
    // Enumerate all of the sidedefs in the lump.
    *enumerateSides() {
        const length = this.length;
        for (let lineIndex = 0; lineIndex < length; lineIndex++) {
            yield this.getSide(lineIndex);
        }
    }
}
exports.WADMapSides = WADMapSides;
// Map sidedef lumps are always named "SIDEDEFS".
WADMapSides.LumpName = "SIDEDEFS";
// The number of bytes which make up each sidedef in the lump.
WADMapSides.ItemSize = 30;
exports.default = WADMapSides;
//# sourceMappingURL=mapSides.js.map