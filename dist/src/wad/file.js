"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileType_1 = require("./fileType");
const lump_1 = require("./lump");
const string_1 = require("./string");
// Represents the contents of one WAD file.
class WADFile {
    constructor(path = "", data) {
        this.path = path;
        this.type = fileType_1.WADFileType.Invalid;
        this.lumps = [];
        this.padLumps = false;
        if (data) {
            this.loadData(data);
        }
    }
    // Add a lump to the end of the list.
    addLump(lump) {
        this.lumps.push(lump);
    }
    // Synchronously read a WAD file from a data buffer.
    // The function will throw an error if there is a problem reading the WAD.
    loadData(data) {
        // Make sure the buffer is long enough to even contain a file header.
        if (data.length < 12) {
            throw new Error("File is too small to be a valid WAD.");
        }
        // Read the file header.
        const typeName = string_1.readPaddedString(data, 0, 4);
        this.type = fileType_1.WADFileType.fromName(typeName);
        // If the file header wasn't either "IWAD" or "PWAD" then immediately
        // abort; this is not a WAD file.
        if (this.type === fileType_1.WADFileType.Invalid) {
            throw new Error("File is corrupt or not a WAD.");
        }
        // Read the rest of the header...
        const numEntries = data.readUInt32LE(4);
        const directoryStart = data.readUInt32LE(8);
        // Read the lump directory
        let dirPosition = directoryStart;
        // Set lump padding to "true" by default, and switch to "false"
        // the first time any lump is found not to be aligned on a 4-byte
        // boundary.
        this.padLumps = true;
        let category = lump_1.WADCategory.None;
        while (this.lumps.length < numEntries && dirPosition < data.length) {
            // Read lump metadata: lump name; data offset and length.
            const lumpStart = data.readUInt32LE(dirPosition);
            const lumpSize = data.readUInt32LE(dirPosition + 4);
            const lumpName = string_1.readPaddedString8(data, dirPosition + 8);
            const lumpEnd = lumpStart + lumpSize;
            // Make sure the lump metadata makes sense
            if (lumpEnd > data.length) {
                throw new Error(`Malformed lump in WAD directory at offset ${dirPosition}.`);
            }
            // Get a buffer representing the lump data
            const lumpData = (lumpStart === lumpEnd ? null : data.slice(lumpStart, lumpEnd));
            // Read the next lump and add it to the list
            const lumpCategory = lump_1.WADLump.categoryOf(lumpName);
            if (lumpCategory !== lump_1.WADCategory.None) {
                category = lumpCategory;
            }
            const lump = new lump_1.WADLump({
                file: this,
                name: lumpName,
                data: lumpData,
                directoryOffset: dirPosition,
                dataOffset: lumpStart,
                dataLength: lumpSize,
                noDataOffset: lumpStart === 0,
                category,
            });
            this.addLump(lump);
            // Reset namespace if the current lump is the end of a namespace
            if (lumpCategory === lump_1.WADCategory.End) {
                category = lump_1.WADCategory.None;
            }
            // Update padLumps flag
            if (lumpStart % 4 !== 0) {
                this.padLumps = false;
            }
            // Advance to the next lump in the directory.
            dirPosition += 16;
        }
        // All done!
        return;
    }
    // Synchronously get a Buffer representing the WAD's binary file content.
    getData() {
        // Get binary data for all lumps
        const lumpDataList = [];
        for (const lump of this.lumps) {
            if (lump.data) {
                lumpDataList.push(lump.data);
            }
        }
        // Write the header
        const headerData = Buffer.alloc(12);
        string_1.writePaddedString(headerData, 0, 4, fileType_1.WADFileType.getName(this.type));
        headerData.writeUInt32LE(this.lumps.length, 4);
        // Write the lump directory
        const directoryData = Buffer.alloc(16 * this.lumps.length);
        let directoryIndex = 0;
        let lumpPosition = 0;
        for (let lumpIndex = 0; lumpIndex < this.lumps.length; lumpIndex++) {
            // Write lump metadata: Data offset, length, and name.
            const lump = this.lumps[lumpIndex];
            const lumpDataOffset = lump.noDataOffset ? 0 : 12 + lumpPosition;
            directoryData.writeUInt32LE(lumpDataOffset, directoryIndex);
            directoryData.writeUInt32LE(lump.length, directoryIndex + 4);
            string_1.writePaddedString(directoryData, directoryIndex + 8, 8, lump.name);
            // Advance 16 bytes in the directory buffer
            directoryIndex += 16;
            // Advance the lump byte position counter; add the lump length,
            lumpPosition += lump.length;
            // And then add padding bytes.
            // (DOOM.WAD and DOOM2.WAD align lumps on 4-byte boundaries.)
            if (this.padLumps) {
                const remBytes = lump.length % 4;
                if (remBytes !== 0) {
                    lumpPosition += 4 - remBytes;
                }
            }
        }
        // TODO: Rewrite using alloc and copy instead of concat
        // Insert padding bytes into the lump data buffer list.
        // Lumps are padded with the first byte of the lump data in order to be
        // consistent with padding behavior in DOOM.WAD and DOOM2.WAD.
        if (this.padLumps) {
            for (let bufferIndex = lumpDataList.length - 1; bufferIndex >= 0; bufferIndex--) {
                const dataBuffer = lumpDataList[bufferIndex];
                const remBytes = dataBuffer.length % 4;
                if (remBytes !== 0) {
                    const padLength = 4 - remBytes;
                    const padByte = dataBuffer.readUInt8(0);
                    const padBuffer = Buffer.alloc(padLength, padByte);
                    lumpDataList.splice(bufferIndex + 1, 0, padBuffer);
                }
            }
        }
        // Get the total length of all lump data.
        const lumpDataTotalLength = lumpDataList.reduce((acc, next) => acc + next.length, 0);
        // Write the lump directory offset to the header.
        // Offset is [header bytes] + [total lump data bytes]
        headerData.writeUInt32LE(12 + lumpDataTotalLength, 8);
        // Concatenate all the buffers and return.
        const buffers = [headerData, ...lumpDataList, directoryData];
        const dataLength = 12 + 16 * this.lumps.length + lumpDataTotalLength;
        return Buffer.concat(buffers, dataLength);
    }
    // Get the first lump with a given name.
    // Returns null if there was no match.
    firstByName(name) {
        for (const lump of this.lumps) {
            if (lump.name === name) {
                return lump;
            }
        }
        return null;
    }
}
exports.WADFile = WADFile;
//# sourceMappingURL=file.js.map