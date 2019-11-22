"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents a GIF image read from a WAD lump.
// GIF images may be either static or animated.
// See: http://www.matthewflickinger.com/lab/whatsinagif/bits_and_bytes.asp
// See: https://en.wikipedia.org/wiki/GIF
class WADGif {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a GIF.
    // Returns false otherwise.
    static match(lump) {
        return !!(lump.data && lump.length >= 6 && (lump.data.slice(0, 6).equals(WADGif.HeaderData87) ||
            lump.data.slice(0, 6).equals(WADGif.HeaderData89)));
    }
    // Create a WADGif given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid GIF lump.");
        }
        return new WADGif(lump.name, lump.data);
    }
    // Get the width of the GIF image in pixels.
    get width() {
        return this.data.readUInt16LE(6);
    }
    // Get the height of the GIF image in pixels.
    get height() {
        return this.data.readUInt16LE(8);
    }
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA() {
        // TODO: Implement this
        // TODO: What to do with animated GIFs?
        return Buffer.alloc(0);
    }
}
exports.WADGif = WADGif;
// All well-formed GIF data starts with one of these two six-byte
// headers, representing "GIF87a" and "GIF89a" in ASCII text.
WADGif.HeaderData87 = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x37, 0x61,
]);
WADGif.HeaderData89 = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
]);
exports.default = WADGif;
//# sourceMappingURL=gif.js.map