"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents WAV audio read from a WAD lump.
class WADWave {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as WAV audio.
    // Returns false otherwise.
    static match(lump) {
        return !!(lump.data && lump.length >= 12 &&
            lump.data.slice(0, 4).equals(WADWave.HeaderData) &&
            lump.data.slice(8, 12).equals(WADWave.WaveData));
    }
    // Create a WADWave given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid PNG lump.");
        }
        return new WADWave(lump.name, lump.data);
    }
}
exports.WADWave = WADWave;
// All well-formed WAV data begins with these four bytes. ("RIFF")
WADWave.HeaderData = Buffer.from([
    0x52, 0x49, 0x46, 0x46,
]);
// All well-formed WAV data has these bytes starting at 0x08. ("WAVE")
WADWave.WaveData = Buffer.from([
    0x57, 0x41, 0x56, 0x45,
]);
exports.default = WADWave;
//# sourceMappingURL=wave.js.map