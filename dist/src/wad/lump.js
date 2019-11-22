"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The namespace a WAD lump is in.
var WADCategory;
(function (WADCategory) {
    WADCategory[WADCategory["None"] = 0] = "None";
    WADCategory[WADCategory["Patches"] = 1] = "Patches";
    WADCategory[WADCategory["Flats"] = 2] = "Flats";
    WADCategory[WADCategory["Sprites"] = 3] = "Sprites";
    WADCategory[WADCategory["End"] = 4] = "End";
})(WADCategory = exports.WADCategory || (exports.WADCategory = {}));
// Represents a WAD lump.
class WADLump {
    constructor(options) {
        this.file = options.file;
        this.name = options.name;
        this.data = options.data;
        this.directoryOffset = options.directoryOffset || 0;
        this.dataOffset = options.dataOffset || 0;
        this.dataLength = options.dataLength || 0;
        this.noDataOffset = options.noDataOffset || false;
        this.category = options.category || WADCategory.None;
    }
    // Gets the namespace associated with this lump
    static categoryOf(name) {
        const patchNamespace = /^P[123P]?_START$/;
        const flatNamespace = /^F[123F]?_START$/;
        const spriteNamespace = "S_START";
        const endNamespace = /_END$/;
        if (patchNamespace.test(name)) {
            return WADCategory.Patches;
        }
        else if (flatNamespace.test(name)) {
            return WADCategory.Flats;
        }
        else if (name === spriteNamespace) {
            return WADCategory.Sprites;
        }
        else if (endNamespace.test(name)) {
            return WADCategory.End;
        }
        return WADCategory.None;
    }
    // Get the path to the WAD containing this lump, if any.
    get filePath() {
        return this.file ? this.file.path : "";
    }
    // Get the length in bytes of this lump's data buffer.
    // Returns 0 if the lump has no data buffer.
    get length() {
        return this.data ? this.data.length : 0;
    }
    setData(data) {
        this.data = data;
    }
    getData() {
        return this.data;
    }
    // Get the index of this lump in the containing WAD file.
    // Returns -1 if the lump is not contained within any file.
    getIndex() {
        if (!this.file) {
            return -1;
        }
        for (let index = 0; index < this.file.lumps.length; index++) {
            if (this.file.lumps[index] === this) {
                return index;
            }
        }
        return -1;
    }
    // Returns the lump before this one in the containing WAD file.
    // Returns null if this was the first lump in the file, or if the lump
    // doesn't actually belong to any file.
    getPreviousLump() {
        const index = this.getIndex();
        if (!this.file || index <= 0) {
            return null;
        }
        else {
            return this.file.lumps[index - 1];
        }
    }
    // Returns the lump after this one in the containing WAD file.
    // Returns null if this was the first lump in the file, or if the lump
    // doesn't actually belong to any file.
    getNextLump() {
        const index = this.getIndex();
        if (!this.file || index < 0 || index >= this.file.lumps.length - 1) {
            return null;
        }
        else {
            return this.file.lumps[index + 1];
        }
    }
    // Enumerate the lumps preceding this one in the containing WAD file.
    // Starts with the immediately prior lump and then continues up the list.
    *enumeratePreviousLumps() {
        let index = this.getIndex();
        if (!this.file || index < 0) {
            return;
        }
        while (--index >= 0) {
            yield this.file.lumps[index];
        }
    }
    // Enumerate the lumps following this one in the containing WAD file.
    *enumerateNextLumps() {
        let index = this.getIndex();
        if (!this.file || index < 0) {
            return;
        }
        while (++index < this.file.lumps.length) {
            yield this.file.lumps[index];
        }
    }
    // Returns true if this lump is between two lumps of the given names.
    // This can be used, for example, to determine if a lump appears between
    // "F_START" and "F_END" markers.
    isBetween(before, after) {
        if (!this.file) {
            return false;
        }
        let between = false;
        for (const lump of this.file.lumps) {
            if (lump === this) {
                return between;
            }
            else if (lump.name === before) {
                between = true;
            }
            else if (lump.name === after) {
                between = false;
            }
        }
        return false;
    }
    isBetweenMulti(before, after) {
        if (!this.file) {
            return false;
        }
        let between = false;
        for (const lump of this.file.lumps) {
            if (lump === this) {
                return between;
            }
            else if (before.indexOf(lump.name) >= 0) {
                between = true;
            }
            else if (after.indexOf(lump.name) >= 0) {
                between = false;
            }
        }
        return false;
    }
}
exports.WADLump = WADLump;
exports.default = WADLump;
//# sourceMappingURL=lump.js.map