"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lumpMap_1 = require("./lumpMap");
const colormap_1 = require("../lumps/doom/colormap");
const colors_1 = require("../lumps/doom/colors");
const playpal_1 = require("../lumps/doom/playpal");
class WADFileList {
    constructor(files) {
        this.files = files || [];
        this.map = new lumpMap_1.WADLumpMap();
        if (files) {
            this.map.addFiles(files);
        }
    }
    // Add a single WAD file to the end of the list.
    // IWAD should be added first and PWADs last.
    addFile(file) {
        this.files.push(file);
        this.map.addFile(file);
    }
    // Get a PLAYPAL lump object given the list of wads or, if none of the WADs
    // contain a PLAYPAL lump, then get a default WADPalette.
    getPlaypal() {
        const lump = this.map.get(playpal_1.WADPalette.LumpName);
        if (lump) {
            return playpal_1.WADPalette.from(lump);
        }
        else {
            return playpal_1.WADPalette.getDefault();
        }
    }
    // Get a COLORMAP lump object given the list of wads or, if none of the WADs
    // contain a COLORMAP lump, then get a default WADColorMap.
    getColormap() {
        const lump = this.map.get(colormap_1.WADColorMap.LumpName);
        if (lump) {
            return colormap_1.WADColorMap.from(lump);
        }
        else {
            return colormap_1.WADColorMap.getDefault();
        }
    }
    // Get a WADColors object containing WADPalette and WADColorMap objects
    // representing the PLAYPAL and COLORMAP lumps loaded from the WAD list.
    // If the WAD list did not include either or both lumps, then defaults
    // will be used instead.
    getColors(palIndex = 0, mapIndex = 0) {
        return new colors_1.WADColors({
            playpal: this.getPlaypal(),
            palIndex: palIndex,
            colormap: this.getColormap(),
            mapIndex: mapIndex,
        });
    }
}
exports.WADFileList = WADFileList;
exports.default = WADFileList;
//# sourceMappingURL=fileList.js.map