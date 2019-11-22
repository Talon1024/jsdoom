"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents OGG Vorbis audio read from a WAD lump.
class WADVorbis {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as OGG Vorbis audio.
    // Returns false otherwise.
    // TODO: This isn't actually quite correct
    static match(lump) {
        return !!(lump.data && lump.length >= 4 &&
            lump.data.slice(0, 4).equals(WADVorbis.HeaderData));
    }
    // Create a WADVorbis given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid PNG lump.");
        }
        return new WADVorbis(lump.name, lump.data);
    }
}
exports.WADVorbis = WADVorbis;
// All well-formed OGG data begins with these four bytes. ("OggS")
WADVorbis.HeaderData = Buffer.from([
    0x4F, 0x67, 0x67, 0x53,
]);
exports.default = WADVorbis;
//# sourceMappingURL=vorbis.js.map