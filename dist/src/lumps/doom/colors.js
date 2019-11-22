"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colormap_1 = require("./colormap");
const playpal_1 = require("./playpal");
// Helper for getting indexed colors given a palette and a color map.
class WADColors {
    constructor(options) {
        this.playpal = options.playpal;
        this.palIndex = options.palIndex || 0;
        this.colormap = options.colormap;
        this.mapIndex = options.mapIndex || 0;
    }
    // Load the Doom 1 palette and colormap.
    static getDefault(palIndex = 0, mapIndex = 0) {
        return new WADColors({
            playpal: playpal_1.WADPalette.getDefault(),
            palIndex: palIndex,
            colormap: colormap_1.WADColorMap.getDefault(),
            mapIndex: mapIndex,
        });
    }
    // Get the color corresponding to an index.
    // Returns an object with "red", "green", and "blue" attributes.
    getColor(index) {
        return this.playpal.getColor(this.palIndex, this.colormap.getColor(this.mapIndex, index));
    }
    // Get the color corresponding to an index.
    // The color is represented as a 4-byte RGBA value.
    // The alpha channel is always 0xff.
    getColorRGBA(index) {
        return this.playpal.getColorRGBA(this.palIndex, this.colormap.getColor(this.mapIndex, index));
    }
    // Get the color corresponding to an index.
    // The color is represented as a 4-byte BGRA value.
    // The alpha channel is always 0xff.
    getColorBGRA(index) {
        return this.playpal.getColorBGRA(this.palIndex, this.colormap.getColor(this.mapIndex, index));
    }
    // Get the color corresponding to an index.
    // The color is represented as a seven-character hex color code string,
    // for example "#000000" or "#ffffff".
    getColorHex(index) {
        return this.playpal.getColorHex(this.palIndex, this.colormap.getColor(this.mapIndex, index));
    }
}
exports.WADColors = WADColors;
exports.default = WADColors;
//# sourceMappingURL=colors.js.map