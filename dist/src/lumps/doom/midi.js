"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents MIDI-format audio read from a WAD lump.
class WADMidi {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a PNG.
    // Returns false otherwise.
    static match(lump) {
        return !!(lump.data && lump.length >= 8 &&
            lump.data.slice(0, 8).equals(WADMidi.HeaderData));
    }
    // Create a WADMidi given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid MUS lump.");
        }
        return new WADMidi(lump.name, lump.data);
    }
}
exports.WADMidi = WADMidi;
// All well-formed MIDI data begins with these eight bytes.
WADMidi.HeaderData = Buffer.from([
    0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
]);
exports.default = WADMidi;
//# sourceMappingURL=midi.js.map