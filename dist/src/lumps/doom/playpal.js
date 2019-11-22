"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultPlaypal_1 = require("./defaultPlaypal");
// Represents a set of palettes to be used with Doom-format graphics,
// e.g. those read from a PLAYPAL lump.
// Each palette is 768 bytes long, containg 256 24-bit RGB color values.
// A Doom PLAYPAL lump contains 14 palettes.
// A Hexen PLAYPAL lump contains 28 palettes.
// See: http://doom.wikia.com/wiki/PLAYPAL
class WADPalette {
    constructor(data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as a PLAYPAL.
    // Returns false otherwise.
    static match(lump) {
        return lump.name.toUpperCase() === WADPalette.LumpName && !!(lump.length && (lump.length % WADPalette.BytesPerPalette === 0));
    }
    // Create a WADPalette given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid PLAYPAL lump.");
        }
        return new WADPalette(lump.data);
    }
    // Load the Doom 1 palette.
    static getDefault() {
        return new WADPalette(WADPalette.DefaultData);
    }
    // Get the number of palettes
    getPaletteCount() {
        return Math.floor(this.data.length / WADPalette.BytesPerPalette);
    }
    // Get the total number of colors,
    // i.e. number of palettes * 256 colors.
    getColorCount() {
        return Math.floor(this.data.length / WADPalette.BytesPerColor);
    }
    // Get the color at a palette and color index.
    // Returns an object with "red", "green", and "blue" attributes.
    getColor(palIndex, colorIndex) {
        const byteIndex = (3 * colorIndex) + (768 * palIndex);
        if (byteIndex < 0 || byteIndex >= this.data.length) {
            throw new Error("Index out of range.");
        }
        return {
            red: this.data.readUInt8(byteIndex),
            green: this.data.readUInt8(byteIndex + 1),
            blue: this.data.readUInt8(byteIndex + 2),
        };
    }
    // Get the color at a palette and color index.
    // The color is represented as a 4-byte RGBA value.
    // The alpha channel is always 0xff.
    getColorRGBA(palIndex, colorIndex) {
        const byteIndex = (3 * colorIndex) + (768 * palIndex);
        if (byteIndex < 0 || byteIndex >= this.data.length) {
            throw new Error("Index out of range.");
        }
        const red = this.data.readUInt8(byteIndex);
        const green = this.data.readUInt8(byteIndex + 1);
        const blue = this.data.readUInt8(byteIndex + 2);
        return 0xff000000 + red + (green << 8) + (blue << 16);
    }
    // Get the color at a palette and color index.
    // The color is represented as a 4-byte BGRA value.
    // The alpha channel is always 0xff.
    getColorBGRA(palIndex, colorIndex) {
        const byteIndex = (3 * colorIndex) + (768 * palIndex);
        if (byteIndex < 0 || byteIndex >= this.data.length) {
            throw new Error("Index out of range.");
        }
        const red = this.data.readUInt8(byteIndex);
        const green = this.data.readUInt8(byteIndex + 1);
        const blue = this.data.readUInt8(byteIndex + 2);
        return 0xff000000 + (red << 16) + (green << 8) + blue;
    }
    // Get the color at a palette and color index.
    // The color is represented as a seven-character hex color code string,
    // for example "#000000" or "#ffffff".
    getColorHex(palIndex, colorIndex) {
        const byteIndex = (3 * colorIndex) + (768 * palIndex);
        if (byteIndex < 0 || byteIndex >= this.data.length) {
            throw new Error("Index out of range.");
        }
        const red = this.data.readUInt8(byteIndex).toString(16);
        const green = this.data.readUInt8(byteIndex + 1).toString(16);
        const blue = this.data.readUInt8(byteIndex + 2).toString(16);
        return "#" + ((red.length === 1 ? "0" + red : red) +
            (green.length === 1 ? "0" + green : green) +
            (blue.length === 1 ? "0" + blue : blue));
    }
    // Set the color at a palette and color index.
    setColor(palIndex, colorIndex, color) {
        const byteIndex = (3 * colorIndex) + (768 * palIndex);
        if (byteIndex < 0 || byteIndex >= this.data.length) {
            throw new Error("Index out of range.");
        }
        this.data.writeUInt8(color.red, byteIndex);
        this.data.writeUInt8(color.green, byteIndex + 1);
        this.data.writeUInt8(color.blue, byteIndex + 2);
    }
    // Get the palettes as pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA() {
        // Create the pixel data: 16 * 16 pixels * N palettes * 4 color channels
        const data = Buffer.alloc(1024 * this.getPaletteCount());
        // Fill the array. TODO: Optimize (after revising Buffer use)
        const total = this.getColorCount();
        for (let colorIndex = 0; colorIndex < total; colorIndex++) {
            data.writeUInt8(this.data.readUInt8((3 * colorIndex) + 0), (4 * colorIndex) + 0);
            data.writeUInt8(this.data.readUInt8((3 * colorIndex) + 1), (4 * colorIndex) + 1);
            data.writeUInt8(this.data.readUInt8((3 * colorIndex) + 2), (4 * colorIndex) + 2);
            data.writeUInt8(0xff, (4 * colorIndex) + 3);
        }
        // All done
        return data;
    }
}
exports.WADPalette = WADPalette;
// Palette lumps are always named "PLAYPAL".
WADPalette.LumpName = "PLAYPAL";
// Contains data for a default PLAYPAL to use when no other is available.
WADPalette.DefaultData = defaultPlaypal_1.DoomPlaypalData;
// The number of colors contained in each palette in the PLAYPAL lump.
WADPalette.ColorsPerPalette = 256;
// The number of bytes per palette in the PLAYPAL lump.
// The total number of palettes in a lump is equal to the lump's length
// in bytes divided by this value.
WADPalette.BytesPerPalette = 768;
// The number of bytes per individual color.
// PLAYPAL lumps contain 24-bit RGB color values.
WADPalette.BytesPerColor = 3;
exports.default = WADPalette;
//# sourceMappingURL=playpal.js.map