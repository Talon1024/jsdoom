"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents MP3 audio read from a WAD lump.
class WADMp3 {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a PNG.
    // Returns false otherwise.
    // TODO: This is NOT foolproof and will result in false negatives.
    static match(lump) {
        return !!(lump.data && lump.length >= 3 &&
            lump.data.slice(0, 3).equals(WADMp3.HeaderData));
    }
    // Create a WADMp3 given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid PNG lump.");
        }
        return new WADMp3(lump.name, lump.data);
    }
}
exports.WADMp3 = WADMp3;
// Most well-formed MP3 data begins with these bytes. ("ID3")
// TODO: Detect MP3 lumps more reliably!
WADMp3.HeaderData = Buffer.from([
    0x49, 0x44, 0x33,
]);
exports.default = WADMp3;
//# sourceMappingURL=mp3.js.map