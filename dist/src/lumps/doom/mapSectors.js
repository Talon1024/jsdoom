"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("../../wad/string");
// Enumeration of recognized types for Doom sectors.
var WADMapSectorType;
(function (WADMapSectorType) {
    // No special sector effect.
    WADMapSectorType[WADMapSectorType["Normal"] = 0] = "Normal";
    // Light blinks randomly.
    WADMapSectorType[WADMapSectorType["BlinkRandom"] = 1] = "BlinkRandom";
    // Light blinks every 0.5 seconds.
    WADMapSectorType[WADMapSectorType["BlinkHalfSecond"] = 2] = "BlinkHalfSecond";
    // Light blinks once per second.
    WADMapSectorType[WADMapSectorType["BlinkSecond"] = 3] = "BlinkSecond";
    // Light blinks every 0.5 second, plus 20% damage per second.
    WADMapSectorType[WADMapSectorType["Damage20AndBlink"] = 4] = "Damage20AndBlink";
    // Inflict ItemSize% damage to the player per second.
    WADMapSectorType[WADMapSectorType["DamageItemSize"] = 5] = "DamageItemSize";
    // Inflict 5% damage to the player per second.
    WADMapSectorType[WADMapSectorType["Damage5"] = 7] = "Damage5";
    // Light glows/oscillates.
    WADMapSectorType[WADMapSectorType["LightGlows"] = 8] = "LightGlows";
    // Sector is marked as a secret.
    WADMapSectorType[WADMapSectorType["Secret"] = 9] = "Secret";
    // Sector closes like a door 30 seconds after level start.
    WADMapSectorType[WADMapSectorType["DoorClose"] = 10] = "DoorClose";
    // Inflict 20% damage to the player per second; exit on death.
    WADMapSectorType[WADMapSectorType["Damage20AndEnd"] = 11] = "Damage20AndEnd";
    // Blink every 0.5 seconds, synchronized.
    WADMapSectorType[WADMapSectorType["BlinkHalfSecondSync"] = 12] = "BlinkHalfSecondSync";
    // Blink once every second, synchronized.
    WADMapSectorType[WADMapSectorType["BlinkSecondSync"] = 13] = "BlinkSecondSync";
    // Sector opens like a door 300 seconds after level start.
    WADMapSectorType[WADMapSectorType["DoorOpen"] = 14] = "DoorOpen";
    // Inflict 20% damage to the player per second.
    WADMapSectorType[WADMapSectorType["Damage20"] = 16] = "Damage20";
    // Sector light flickers randomly.
    WADMapSectorType[WADMapSectorType["Flicker"] = 17] = "Flicker";
})(WADMapSectorType = exports.WADMapSectorType || (exports.WADMapSectorType = {}));
// Boom sector flags.
var WADMapSectorFlag;
(function (WADMapSectorFlag) {
    WADMapSectorFlag[WADMapSectorFlag["Damage5"] = 32] = "Damage5";
    WADMapSectorFlag[WADMapSectorFlag["DamageItemSize"] = 64] = "DamageItemSize";
    WADMapSectorFlag[WADMapSectorFlag["Damage20"] = 96] = "Damage20";
    WADMapSectorFlag[WADMapSectorFlag["Secret"] = 128] = "Secret";
    WADMapSectorFlag[WADMapSectorFlag["Friction"] = 256] = "Friction";
    WADMapSectorFlag[WADMapSectorFlag["Pusher"] = 512] = "Pusher";
})(WADMapSectorFlag = exports.WADMapSectorFlag || (exports.WADMapSectorFlag = {}));
// Represents a single sector read from a Doom or Heretic format SECTORS lump.
class WADMapSector {
    constructor(options) {
        this.floorHeight = options.floorHeight;
        this.ceilingHeight = options.ceilingHeight;
        this.floorFlat = options.floorFlat;
        this.ceilingFlat = options.ceilingFlat;
        this.light = options.light;
        this.type = options.type;
        this.tag = options.tag;
    }
}
exports.WADMapSector = WADMapSector;
// Represents a Doom or Heretic format "SECTORS" lump.
// See: https://doomwiki.org/wiki/Sector
class WADMapSectors {
    constructor(name, data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as map sectors.
    // Returns false otherwise.
    static match(lump) {
        return lump.length % WADMapSectors.ItemSize === 0 && (lump.name.toUpperCase() === WADMapSectors.LumpName);
    }
    // Create a WADMapSectors given a WADLump object.
    static from(lump) {
        return new WADMapSectors(lump.name, lump.data);
    }
    // Get the number of sectors represented in the lump.
    get length() {
        return Math.floor(this.data.length / WADMapSectors.ItemSize);
    }
    // Get the sector at an index.
    getSector(sectorIndex) {
        if (sectorIndex < 0 || sectorIndex >= this.length) {
            throw new Error("Sector index out of bounds.");
        }
        const sectorOffset = WADMapSectors.ItemSize * sectorIndex;
        return new WADMapSector({
            floorHeight: this.data.readInt16LE(sectorOffset),
            ceilingHeight: this.data.readInt16LE(sectorOffset + 2),
            floorFlat: string_1.readPaddedString8(this.data, sectorOffset + 4),
            ceilingFlat: string_1.readPaddedString8(this.data, sectorOffset + 12),
            light: this.data.readInt16LE(sectorOffset + 20),
            type: this.data.readUInt16LE(sectorOffset + 22),
            tag: this.data.readUInt16LE(sectorOffset + 24),
        });
    }
    // Enumerate all of the sectors in the lump.
    *enumerateSectors() {
        const length = this.length;
        for (let sectorIndex = 0; sectorIndex < length; sectorIndex++) {
            yield this.getSector(sectorIndex);
        }
    }
}
exports.WADMapSectors = WADMapSectors;
// Map sectors lumps are always named "SECTORS".
WADMapSectors.LumpName = "SECTORS";
// The number of bytes which make up each sector in the lump.
WADMapSectors.ItemSize = 26;
exports.default = WADMapSectors;
//# sourceMappingURL=mapSectors.js.map