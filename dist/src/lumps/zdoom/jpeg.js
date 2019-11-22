"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents a JPEG image read from a WAD lump.
// JPEG images may be either static or animated.
// See: https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format
// See: https://www.w3.org/Graphics/JPEG/jfif3.pdf
class WADJpeg {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a JPEG.
    // Returns false otherwise.
    static match(lump) {
        const length = lump.length;
        return !!(lump.data && length >= 3 && (lump.data.slice(0x00, 0x04).equals(WADJpeg.HeaderData) &&
            lump.data.slice(0x06, 0x0B).equals(WADJpeg.App0Identifier) &&
            lump.data.slice(length - 2, length).equals(WADJpeg.FooterData)));
    }
    // Create a WADJpeg given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid JPEG lump.");
        }
        return new WADJpeg(lump.name, lump.data);
    }
    // Get JPEG density units.
    // Get the width of the JPEG image in pixels.
    get width() {
        // TODO: Implement this
        return 0;
    }
    // Get the height of the JPEG image in pixels.
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
exports.WADJpeg = WADJpeg;
// Most well-formed JPEG data has set bytes at offsets 0x00 until 0x04 and
// 0x06 until 0x0B, and another two set bytes at the end of the file.
// EXIF JPEG files notably do not always follow this format.
// Start of Image (SOI) (0xFF 0xD8) then Start of JFIF-APP0 (0xFF 0xE0)
WADJpeg.HeaderData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0,
]);
// Null-terminated "JFIF" APP0 identifier. Always appears at offset 0x06.
WADJpeg.App0Identifier = Buffer.from([
    0x4A, 0x46, 0x49, 0x46, 0x00,
]);
// End of Image (EOI) (0xFF 0xD9). Always appears at the end of the file.
WADJpeg.FooterData = Buffer.from([
    0xFF, 0xD9,
]);
exports.default = WADJpeg;
//# sourceMappingURL=jpeg.js.map