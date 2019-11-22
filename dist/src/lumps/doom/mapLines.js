"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapLineSpecial_1 = require("./mapLineSpecial");
const mapLineSpecial_2 = require("./mapLineSpecial");
// Enumeration of recognized flags for Doom linedefs.
// Includes Boom extensions.
var WADMapLineFlag;
(function (WADMapLineFlag) {
    // Block movement of players and monsters
    WADMapLineFlag[WADMapLineFlag["Impassable"] = 1] = "Impassable";
    // Block movement of monsters (but not players)
    WADMapLineFlag[WADMapLineFlag["BlockMonsters"] = 2] = "BlockMonsters";
    // One-sided linedefs separate a sector from the "void" whereas
    // two-sided linedefs separate sectors from each other.
    WADMapLineFlag[WADMapLineFlag["TwoSided"] = 4] = "TwoSided";
    // Unpegged upper texture (affects vertical offset)
    WADMapLineFlag[WADMapLineFlag["UpperUnpegged"] = 8] = "UpperUnpegged";
    // Unpegged lower texture (affects vertical offset)
    WADMapLineFlag[WADMapLineFlag["LowerUnpegged"] = 16] = "LowerUnpegged";
    // Shown as one-sided on automap
    // Also prevents monsters from activating a door action linedef
    WADMapLineFlag[WADMapLineFlag["Secret"] = 32] = "Secret";
    // Blocks sound propagation.
    WADMapLineFlag[WADMapLineFlag["BlockSound"] = 64] = "BlockSound";
    // Never shown on the automap.
    WADMapLineFlag[WADMapLineFlag["NoAutomap"] = 128] = "NoAutomap";
    // Always shown on the automap.
    WADMapLineFlag[WADMapLineFlag["AlwaysAutomap"] = 256] = "AlwaysAutomap";
    // Pass-through action. (Boom)
    WADMapLineFlag[WADMapLineFlag["PassThrough"] = 512] = "PassThrough";
})(WADMapLineFlag = exports.WADMapLineFlag || (exports.WADMapLineFlag = {}));
// Represents a single linedef read from a Doom format LINEDEFS lump.
class WADMapLine {
    constructor(options) {
        this.startVertex = options.startVertex;
        this.endVertex = options.endVertex;
        this.flags = options.flags;
        this.special = options.special;
        this.tag = options.tag;
        this.frontSidedef = options.frontSidedef;
        this.backSidedef = options.backSidedef;
    }
    getSpecialObject() {
        for (const special of mapLineSpecial_2.WADMapLineSpecialGeneralizedList) {
            if (this.special >= special.low && this.special < special.high) {
                return special;
            }
        }
        for (const special of mapLineSpecial_1.WADMapLineSpecialList) {
            if (this.special === special.id) {
                return special;
            }
        }
        return null;
    }
    get impassableFlag() {
        return !!(this.flags & WADMapLineFlag.Impassable);
    }
    get blockMonstersFlag() {
        return !!(this.flags & WADMapLineFlag.BlockMonsters);
    }
    get twoSidedFlag() {
        return !!(this.flags & WADMapLineFlag.TwoSided);
    }
    get upperUnpeggedFlag() {
        return !!(this.flags & WADMapLineFlag.UpperUnpegged);
    }
    get lowerUnpeggedFlag() {
        return !!(this.flags & WADMapLineFlag.LowerUnpegged);
    }
    get secretFlag() {
        return !!(this.flags & WADMapLineFlag.Secret);
    }
    get blockSoundFlag() {
        return !!(this.flags & WADMapLineFlag.BlockSound);
    }
    get noAutomapFlag() {
        return !!(this.flags & WADMapLineFlag.NoAutomap);
    }
    get alwaysAutomapFlag() {
        return !!(this.flags & WADMapLineFlag.AlwaysAutomap);
    }
    get passThroughFlag() {
        return !!(this.flags & WADMapLineFlag.PassThrough);
    }
}
exports.WADMapLine = WADMapLine;
// Represents a Doom format "LINEDEFS" lump.
// See: https://doomwiki.org/wiki/Linedef
class WADMapLines {
    constructor(name, data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as map linedefs.
    // Returns false otherwise.
    static match(lump) {
        return lump.length % WADMapLines.ItemSize === 0 && (lump.name.toUpperCase() === WADMapLines.LumpName);
    }
    // Create a WADMapLines given a WADLump object.
    static from(lump) {
        return new WADMapLines(lump.name, lump.data);
    }
    // Get the number of linedefs represented in the lump.
    get length() {
        return Math.floor(this.data.length / WADMapLines.ItemSize);
    }
    // Get the linedef at an index.
    getLine(lineIndex) {
        if (lineIndex < 0 || lineIndex >= this.length) {
            throw new Error("Linedef index out of bounds.");
        }
        const lineOffset = WADMapLines.ItemSize * lineIndex;
        return new WADMapLine({
            startVertex: this.data.readUInt16LE(lineOffset),
            endVertex: this.data.readUInt16LE(lineOffset + 2),
            flags: this.data.readUInt16LE(lineOffset + 4),
            special: this.data.readUInt16LE(lineOffset + 6),
            tag: this.data.readUInt16LE(lineOffset + 8),
            frontSidedef: this.data.readUInt16LE(lineOffset + 10),
            backSidedef: this.data.readUInt16LE(lineOffset + 12),
        });
    }
    // Enumerate all of the linedefs in the lump.
    *enumerateLines() {
        const length = this.length;
        for (let lineIndex = 0; lineIndex < length; lineIndex++) {
            yield this.getLine(lineIndex);
        }
    }
}
exports.WADMapLines = WADMapLines;
// Map linedef lumps are always named "LINEDEFS".
WADMapLines.LumpName = "LINEDEFS";
// The number of bytes which make up each linedef in the lump.
WADMapLines.ItemSize = 14;
exports.default = WADMapLines;
//# sourceMappingURL=mapLines.js.map