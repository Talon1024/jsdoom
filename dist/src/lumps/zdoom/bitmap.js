"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// An enumeration of supported DIB header types.
// OS/2-exclusive header types are not supported. (They're friggin ancient.)
// Adobe-exclusive header types are not supported. (No official documentation.)
exports.DIBHeaderTypeList = [
    // BITMAPCOREHEADER
    // https://docs.microsoft.com/en-us/windows/desktop/api/wingdi/ns-wingdi-tagbitmapcoreheader
    {
        headerSize: 12,
        getWidth: (data) => data.readUInt16LE(18),
        getHeight: (data) => data.readUInt16LE(20),
    },
    // BITMAPINFOHEADER
    // https://msdn.microsoft.com/en-us/library/windows/desktop/dd183376(v=vs.85).aspx
    {
        headerSize: 40,
        getWidth: (data) => data.readInt32LE(18),
        getHeight: (data) => data.readInt32LE(22),
    },
    // BITMAPV4HEADER
    // https://docs.microsoft.com/en-us/windows/desktop/api/wingdi/ns-wingdi-bitmapv4header
    {
        headerSize: 108,
        getWidth: (data) => data.readInt32LE(18),
        getHeight: (data) => data.readInt32LE(22),
    },
    // BITMAPV5HEADER
    // https://docs.microsoft.com/en-us/windows/desktop/api/wingdi/ns-wingdi-bitmapv5header
    {
        headerSize: 124,
        getWidth: (data) => data.readInt32LE(18),
        getHeight: (data) => data.readInt32LE(22),
    },
];
// Represents a bitmap (BMP) image read from a WAD lump.
// See: https://en.wikipedia.org/wiki/BMP_file_format
class WADBitmap {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a bitmap.
    // Returns false otherwise.
    static match(lump) {
        return !!(lump.data && lump.length >= 6 &&
            lump.data.slice(0, 2).equals(WADBitmap.HeaderData) &&
            lump.data.readUInt32LE(2) === lump.length);
    }
    // Create a WADBitmap given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid bitmap lump.");
        }
        return new WADBitmap(lump.name, lump.data);
    }
    // Get the size in bytes of the DIB header.
    getDIBHeaderSize() {
        return this.data.readUInt32LE(14);
    }
    // Get the width of the bitmap in pixels.
    get width() {
        const headerSize = this.getDIBHeaderSize();
        for (const header of exports.DIBHeaderTypeList) {
            if (header.headerSize === headerSize) {
                return header.getWidth(this.data);
            }
        }
        throw new Error("Unrecognized bitmap type.");
    }
    // Get the height of the bitmap in pixels.
    get height() {
        const headerSize = this.getDIBHeaderSize();
        for (const header of exports.DIBHeaderTypeList) {
            if (header.headerSize === headerSize) {
                return header.getHeight(this.data);
            }
        }
        throw new Error("Unrecognized bitmap type.");
    }
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA() {
        // TODO: Implement this
        return Buffer.alloc(0);
    }
}
exports.WADBitmap = WADBitmap;
// Most well-formed BMP data begins with these two bytes ("BM") followed
// by a 4-byte little-endian count of the number of bytes in the bitmap.
// Only OS/2 bitmaps have a different header, and it is probably more
// effort than it's worth to support OS/2 bitmap formats.
WADBitmap.HeaderData = Buffer.from([
    0x42, 0x4D,
]);
// The sizes of supported DIB header types, given in bytes.
// OS/2-exclusive header types have been omitted.
// Adobe-exclusive header types have been omitted.
WADBitmap.BitmapCoreHeaderSize = 12;
WADBitmap.BitmapInfoHeaderSize = 40;
WADBitmap.BitmapV4HeaderSize = 108;
WADBitmap.BitmapV5HeaderSize = 124;
exports.default = WADBitmap;
//# sourceMappingURL=bitmap.js.map