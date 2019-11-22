"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const UPNG = require("upng-js");
const options_1 = require("./options");
const colormap_1 = require("../lumps/doom/colormap");
const flat_1 = require("../lumps/doom/flat");
const picture_1 = require("../lumps/doom/picture");
const playpal_1 = require("../lumps/doom/playpal");
const file_1 = require("../wad/file");
const fileList_1 = require("../wad/fileList");
exports.helpText = `
This is the jsdoom lump export utility.

Example usage:
  export-flat -iwad DOOM1.WAD -file mywad.wad -lump FLAT10
`.trim();
exports.cliParser = new options_1.Parser([
    {
        name: "iwad",
        help: "Path to the IWAD file. Same as most Doom ports.",
        type: String,
    },
    {
        name: "file",
        help: "Paths to one or more PWADs. Same as most Doom ports.",
        type: String,
        list: true,
    },
    {
        name: "lump",
        help: "The name of the lump to export, for example \"FLAT10\".",
        type: String,
    },
    {
        name: "path",
        help: "The path to write the exported file to.",
        type: String,
    },
    {
        name: "format",
        help: "The file format to write, for example \"LMP\" or \"PNG\".",
        type: String,
    },
    {
        name: "help",
        help: "Display this help text.",
        type: Boolean,
        flag: true,
    },
]);
function isDirectory(filePath) {
    if (!fs.existsSync(filePath)) {
        return false;
    }
    return fs.statSync(filePath).isDirectory();
}
// Loads a lump from a WAD list and exports it as a file of the most
// appropriate type. If no special format can be found for the given
// lump, then it is simply exported as a binary *.LMP file.
// Returns the path to the outputted file.
function exportLump(options) {
    function getPath(extension) {
        if (!options.path) {
            return lumpName + "." + extension;
        }
        else if (isDirectory(options.path)) {
            return path.join(options.path, lumpName + "." + extension);
        }
        else {
            return options.path;
        }
    }
    const files = options.files;
    const lumpName = options.lumpName;
    const format = (options.format || "").toUpperCase();
    const lump = files.map.get(lumpName);
    if (!lump) {
        throw new Error(`Found no lump named "${lumpName}".`);
    }
    // Export as a regular binary LMP file
    if (format === "LMP") {
        const outPath = getPath("LMP");
        fs.writeFileSync(outPath, lump.data);
        return outPath;
    }
    // Export playpal as PNG
    else if (playpal_1.WADPalette.match(lump) && (!format || format === "PNG")) {
        const playpal = playpal_1.WADPalette.from(lump);
        const data = playpal.getPixelDataRGBA();
        const png = UPNG.encode([data.buffer], 16, 16 * playpal.getPaletteCount(), 0);
        const outPath = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export colormap as PNG
    else if (colormap_1.WADColorMap.match(lump) && (!format || format === "PNG")) {
        const colormap = colormap_1.WADColorMap.from(lump);
        const data = colormap.getPixelDataRGBA(files.getPlaypal());
        const png = UPNG.encode([data.buffer], 16, 16 * colormap.getMapCount(), 256);
        const outPath = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export patch, sprite, or menu graphic as PNG
    else if (picture_1.WADPicture.match(lump) && (!format || format === "PNG")) {
        const graphic = picture_1.WADPicture.from(lump);
        const data = graphic.getPixelDataRGBA(files.getColors());
        const colors = graphic.countColors() <= 256 ? 256 : 0;
        const png = UPNG.encode([data.buffer], graphic.width, graphic.height, colors);
        const outPath = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export flat as PNG
    else if (flat_1.WADFlat.match(lump) && (!format || format === "PNG")) {
        const graphic = flat_1.WADFlat.from(lump);
        const data = graphic.getPixelDataRGBA(files.getColors());
        const png = UPNG.encode([data.buffer], graphic.width, graphic.height, 256);
        const outPath = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export generic lump as LMP
    else if (!format) {
        const outPath = getPath("LMP");
        fs.writeFileSync(outPath, lump.data);
        return outPath;
    }
    // Failure
    else {
        throw new Error(`Can't export "${lumpName}" in format "${format}".`);
    }
}
exports.exportLump = exportLump;
async function main() {
    const args = exports.cliParser.parse();
    if (args.help) {
        exports.cliParser.showHelp(exports.helpText);
    }
    else {
        if (!args.lump) {
            throw new Error("Must specify a lump name.");
        }
        const paths = args.file || [];
        if (args.iwad) {
            paths.splice(0, 0, args.iwad);
        }
        if (!paths.length) {
            throw new Error("Must specify an IWAD or at least one PWAD.");
        }
        console.log("Loading WADs...");
        const files = new fileList_1.WADFileList();
        for (const path of paths) {
            console.log(`Loading "${path}".`);
            const data = fs.readFileSync(path);
            const file = new file_1.WADFile(path, data);
            files.addFile(file);
        }
        console.log("Finished loading WADs.");
        console.log(`Exporting lump "${args.lump}".`);
        const outPath = exportLump({
            files: files,
            lumpName: args.lump,
            format: args.format,
            path: args.path,
        });
        console.log(`Finished exporting "${args.lump}" to "${outPath}".`);
    }
}
if (typeof (require) !== "undefined" && require.main === module) {
    main().then(() => { }).catch((error) => {
        console.log(error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=export.js.map