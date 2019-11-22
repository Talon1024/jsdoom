"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapThingType_1 = require("./mapThingType");
// Enumeration of recognized flags for Doom/Heretic things.
// Includes Boom and MBF extensions.
var WADMapThingFlag;
(function (WADMapThingFlag) {
    // Present on easy skill levels 1 and 2 (TYTD & HNTR)
    WADMapThingFlag[WADMapThingFlag["Easy"] = 1] = "Easy";
    // Present on medium skill level 3 (HMP)
    WADMapThingFlag[WADMapThingFlag["Medium"] = 2] = "Medium";
    // Present on hard skill levels 4 and 5 (UV & NM)
    WADMapThingFlag[WADMapThingFlag["Hard"] = 4] = "Hard";
    // Deaf/ambush flag
    WADMapThingFlag[WADMapThingFlag["Ambush"] = 8] = "Ambush";
    // Multiplayer only; not present in single-player
    WADMapThingFlag[WADMapThingFlag["MultiplayerOnly"] = 16] = "MultiplayerOnly";
    // Doesn't appear in deathmatch (Boom)
    WADMapThingFlag[WADMapThingFlag["NoDeathmatch"] = 32] = "NoDeathmatch";
    // Doesn't appear in co-op (Boom)
    WADMapThingFlag[WADMapThingFlag["NoCooperative"] = 64] = "NoCooperative";
    // Friendly monster (Marine's Best Friend)
    WADMapThingFlag[WADMapThingFlag["Friendly"] = 128] = "Friendly";
})(WADMapThingFlag = exports.WADMapThingFlag || (exports.WADMapThingFlag = {}));
// Represents a single thing read from a Doom or Heretic format THINGS lump.
class WADMapThing {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.angle = options.angle;
        this.type = options.type;
        this.flags = options.flags;
    }
    // Get a WADMapThingType object corresponding to the thing's type number.
    // Returns null if there was no matching thing type.
    getTypeObject() {
        let type = mapThingType_1.WADMapThingTypeMap[this.type];
        if (type === undefined) {
            type = null;
        }
        return type;
    }
    get easyFlag() {
        return !!(this.flags & WADMapThingFlag.Easy);
    }
    get mediumFlag() {
        return !!(this.flags & WADMapThingFlag.Medium);
    }
    get hardFlag() {
        return !!(this.flags & WADMapThingFlag.Hard);
    }
    get ambushFlag() {
        return !!(this.flags & WADMapThingFlag.Ambush);
    }
    get multiplayerOnlyFlag() {
        return !!(this.flags & WADMapThingFlag.MultiplayerOnly);
    }
    get noDeathmatchFlag() {
        return !!(this.flags & WADMapThingFlag.NoDeathmatch);
    }
    get noCooperativeFlag() {
        return !!(this.flags & WADMapThingFlag.NoCooperative);
    }
    get friendlyFlag() {
        return !!(this.flags & WADMapThingFlag.Friendly);
    }
}
exports.WADMapThing = WADMapThing;
// Represents a Doom or Heretic format "THINGS" lump.
// See: https://doomwiki.org/wiki/Thing
class WADMapThings {
    constructor(name, data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as map things.
    // Returns false otherwise.
    static match(lump) {
        return lump.length % WADMapThings.ItemSize === 0 && (lump.name.toUpperCase() === WADMapThings.LumpName);
    }
    // Create a WADMapThings given a WADLump object.
    static from(lump) {
        return new WADMapThings(lump.name, lump.data);
    }
    // Get the number of things represented in the lump.
    get length() {
        return Math.floor(this.data.length / WADMapThings.ItemSize);
    }
    // Get the thing at an index.
    getThing(thingIndex) {
        if (thingIndex < 0 || thingIndex >= this.length) {
            throw new Error("Thing index out of bounds.");
        }
        const thingOffset = WADMapThings.ItemSize * thingIndex;
        return new WADMapThing({
            x: this.data.readInt16LE(thingOffset),
            y: this.data.readInt16LE(thingOffset + 2),
            angle: this.data.readInt16LE(thingOffset + 4),
            type: this.data.readUInt16LE(thingOffset + 6),
            flags: this.data.readUInt16LE(thingOffset + 8),
        });
    }
    // Enumerate all of the things in the lump.
    *enumerateThings() {
        const length = this.length;
        for (let thingIndex = 0; thingIndex < length; thingIndex++) {
            yield this.getThing(thingIndex);
        }
    }
}
exports.WADMapThings = WADMapThings;
// Map things lumps are always named "THINGS".
WADMapThings.LumpName = "THINGS";
// The number of bytes which make up each thing in the lump.
WADMapThings.ItemSize = 10;
exports.default = WADMapThings;
//# sourceMappingURL=mapThings.js.map