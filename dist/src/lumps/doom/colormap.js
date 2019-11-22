"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colormapNames_1 = require("./colormapNames");
const defaultColormap_1 = require("./defaultColormap");
// Represents a color map, e.g. as read from a COLORMAP lump.
// A Doom COLORMAP lump normally contains 34 maps.
// The color map describes what palette color graphics should use under
// given circumstances.
// Doom has a map for each light level (32 total), one for the godsphere,
// and one unused all-black map.
// See: http://doom.wikia.com/wiki/COLORMAP
class WADColorMap {
    constructor(data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as a COLORMAP.
    // Returns false otherwise.
    static match(lump) {
        return lump.name.toUpperCase() === WADColorMap.LumpName && !!(lump.length && (lump.length % 256 === 0));
    }
    // Create a WADColorMap given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid COLORMAP lump.");
        }
        return new WADColorMap(lump.data);
    }
    // Load the Doom 1 color map.
    static getDefault() {
        return new WADColorMap(WADColorMap.DefaultData);
    }
    // Get the number of maps contained in this COLORMAP.
    getMapCount() {
        return Math.floor(this.data.length / 256);
    }
    // Get the color at a map index and a color index.
    // Returns a color as a palette (PLAYPAL) index.
    getColor(mapIndex, colorIndex) {
        const byteIndex = colorIndex + (256 * mapIndex);
        if (byteIndex < 0 || byteIndex >= this.data.length) {
            throw new Error("Index out of range.");
        }
        return this.data.readUInt8(byteIndex);
    }
    // Set the color at a map and color index.
    // Accepts a palette (PLAYPAL) index.
    setColor(mapIndex, colorIndex, color) {
        const byteIndex = colorIndex + (256 * mapIndex);
        if (byteIndex < 0 || byteIndex >= this.data.length) {
            throw new Error("Index out of range.");
        }
        this.data.writeUInt8(color, byteIndex);
    }
    // Get the color maps as pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(playpal, palIndex = 0) {
        // Create the pixel data: 16 * 16 pixels * N maps * 4 color channels
        const maps = this.getMapCount();
        const data = Buffer.alloc(1024 * maps);
        // Fill the array. TODO: Can this be optimized?
        const total = this.data.length;
        for (let colorIndex = 0; colorIndex < total; colorIndex++) {
            const index = this.data.readUInt8(colorIndex);
            const rgba = playpal.getColorRGBA(palIndex, index);
            data.writeUInt32LE(rgba, 4 * colorIndex);
        }
        // All done
        return data;
    }
}
exports.WADColorMap = WADColorMap;
// Color map lumps are always named "COLORMAP".
WADColorMap.LumpName = "COLORMAP";
// Contains data for a default COLORMAP to use when no other is available.
WADColorMap.DefaultData = defaultColormap_1.DoomColormapData;
// Index of the megasphere (invulnerability) color map.
WADColorMap.Invulnerable = 32;
// A list of human-readable descriptions for each colormap's purpose
// as it pertains to Doom.
WADColorMap.DoomColormapNames = colormapNames_1.DoomColormapNames;
exports.default = WADColorMap;
//# sourceMappingURL=colormap.js.map