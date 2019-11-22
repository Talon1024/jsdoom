"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents a PNG image read from a WAD lump.
class WADPng {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a PNG.
    // Returns false otherwise.
    static match(lump) {
        return !!(lump.data && lump.length >= 8 &&
            lump.data.slice(0, 8).equals(WADPng.HeaderData));
    }
    // Create a WADPng given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid PNG lump.");
        }
        return new WADPng(lump.name, lump.data);
    }
    // Get the width of the PNG in pixels.
    get width() {
        // TODO: Implement this
        return 0;
    }
    // Get the height of the PNG in pixels.
    get height() {
        // TODO: Implement this
        return 0;
    }
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA() {
        // TODO: Implement this
        return Buffer.alloc(0);
    }
}
exports.WADPng = WADPng;
// All well-formed PNG data begins with these eight bytes.
WADPng.HeaderData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
]);
exports.default = WADPng;
//# sourceMappingURL=png.js.map