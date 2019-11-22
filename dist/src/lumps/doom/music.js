"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents MUS-format audio read from a WAD lump.
class WADMusic {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as MUS audio.
    // Returns false otherwise.
    static match(lump) {
        return !!(lump.data && lump.length >= 4 &&
            lump.data.slice(0, 4).equals(WADMusic.HeaderData));
    }
    // Create a WADMusic given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid MUS lump.");
        }
        return new WADMusic(lump.name, lump.data);
    }
}
exports.WADMusic = WADMusic;
// All well-formed MUS data begins with these four bytes.
WADMusic.HeaderData = Buffer.from([
    0x4D, 0x55, 0x53, 0x1A,
]);
exports.default = WADMusic;
//# sourceMappingURL=music.js.map