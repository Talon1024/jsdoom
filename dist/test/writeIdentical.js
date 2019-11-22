"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const open_1 = require("./open");
// This function reads a WAD and then writes it back to a new file path,
// and then verifies that the input and output files are byte-identical.
// The function returns normally on success and throws an Error on failure.
async function testWriteIdentical(wadPath, wadName) {
    // Read the WAD file
    const wad = await open_1.openTestWad(wadPath, wadName);
    // Save the WAD file
    const saveFilePath = wad.path + ".copy";
    console.log(`Writing a copy to path "${saveFilePath}"...`);
    const saveData = wad.getData();
    fs.writeFileSync(saveFilePath, saveData);
    console.log("Finished writing WAD file.");
    // Make sure the input and output files are identical
    // Fail the test if the files are different
    console.log("Checking if WAD files are identical...");
    const readBuffer = fs.readFileSync(wad.path);
    const savedBuffer = fs.readFileSync(saveFilePath);
    if (readBuffer.equals(savedBuffer)) {
        console.log("OK: Files are IDENTICAL.");
    }
    else {
        console.log("NO: Files are DIFFERENT.");
        throw new Error("Files are different.");
    }
}
exports.testWriteIdentical = testWriteIdentical;
exports.default = testWriteIdentical;
//# sourceMappingURL=writeIdentical.js.map