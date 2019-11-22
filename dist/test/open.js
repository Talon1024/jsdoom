"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const file_1 = require("../src/wad/file");
const download_1 = require("./download");
// This function reads a WAD and then writes it back to a new file path,
// and then verifies that the input and output files are byte-identical.
// The function returns normally on success and throws an Error on failure.
async function openTestWad(wadPath, wadName) {
    // Check if the file exists and attempt to download it if not
    const filePath = path.join(wadPath, wadName);
    if (!fs.existsSync(filePath)) {
        await download_1.downloadTestWad(wadPath, wadName);
    }
    // Read the WAD file
    console.log(`Loading WAD from path "${filePath}"...`);
    const fileData = fs.readFileSync(filePath);
    const file = new file_1.WADFile(filePath, fileData);
    // Log data about the WAD file (more if the "verbose" flag is set)
    console.log(`Finished loading WAD file. (Found ${file.lumps.length} lumps.)`);
    console.log(`Lumps in the WAD were padded? ${file.padLumps}`);
    // All done
    return file;
}
exports.openTestWad = openTestWad;
exports.default = openTestWad;
//# sourceMappingURL=open.js.map