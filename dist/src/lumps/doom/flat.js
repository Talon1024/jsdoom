"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lump_1 = require("../../wad/lump");
// Represents one 64 by 64 pixel graphic that is normally used to paint floors
// and ceilings.
// The exclusive use of flats to paint floors and ceilings is is a strict
// limitation in the vanilla Doom engine but the limitation is relaxed in ZDoom
// ports.
class WADFlat {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a flat.
    // Returns false otherwise.
    static match(lump) {
        return lump.category === lump_1.WADCategory.Flats && lump.length === 4096;
    }
    // Create a WADFlat given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid flat lump.");
        }
        return new WADFlat(lump.name, lump.data);
    }
    // Get the width of the flat in pixels.
    get width() {
        return 64;
    }
    // Get the height of the flat in pixels.
    get height() {
        return 64;
    }
    // Get the pixel color index at a coordinate.
    getPixel(x, y) {
        return this.data.readUInt8(x + (64 * y));
    }
    // Set the pixel color index at a coordinate.
    setPixel(x, y, color) {
        this.data.writeUInt8(color, x + (64 * y));
    }
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(colors) {
        // Create the pixel data: 64 * 64 pixels * 4 color channels
        const data = Buffer.alloc(16384);
        // Fill the array
        for (let pixelIndex = 0; pixelIndex < 4096; pixelIndex++) {
            const colorIndex = this.data.readUInt8(pixelIndex);
            const colorRGBA = colors.getColorRGBA(colorIndex);
            data.writeUInt32LE(colorRGBA, 4 * pixelIndex);
        }
        // All done
        return data;
    }
    // Tell whether or not this flat has transparent pixels in it.
    isTransparent() {
        // Flats are just 4096 bytes, each byte mapping to a palette index, so no pixels are transparent.
        return false;
    }
}
exports.WADFlat = WADFlat;
// Names of the markers used in the IWAD to denote the beginning and
// end of the flat namespace
WADFlat.IWADMarkerNames = [
    "F_START", "F1_START", "F2_START", "F3_START",
    "F_END", "F1_END", "F2_END", "F3_END",
];
// The name of the marker at the beginning of the flat namespace.
WADFlat.IWADMarkerStart = "F_START";
// The name of the marker at the end of the flat namespace.
WADFlat.IWADMarkerEnd = "F_END";
// Names of markers used in PWADs to denote the beginning/end of the flat
// namespace. Unlike the IWAD marker names, these can be used in addition
// to the flats in the IWADs.
WADFlat.PWADMarkerNames = [
    "FF_START", "FF_END",
];
// The name of the marker at the beginning of the custom flat namespace.
WADFlat.PWADMarkerStart = "FF_START";
// The name of the marker at the end of the custom flat namespace.
WADFlat.PWADMarkerEnd = "FF_END";
exports.default = WADFlat;
//# sourceMappingURL=flat.js.map