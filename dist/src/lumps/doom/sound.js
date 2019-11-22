"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents DMX-format audio read from a WAD lump.
class WADSound {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as DMX audio.
    // Returns false otherwise.
    static match(lump) {
        return !!(lump.name.startsWith("DS") &&
            lump.data && lump.length >= 2 &&
            lump.data.slice(0, 2).equals(WADSound.HeaderData));
    }
    // Create a WADSound given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid DMX lump.");
        }
        return new WADSound(lump.name, lump.data);
    }
}
exports.WADSound = WADSound;
// All well-formed DMX data begins with these two bytes.
WADSound.HeaderData = Buffer.from([
    0x03, 0x00,
]);
exports.default = WADSound;
//# sourceMappingURL=sound.js.map