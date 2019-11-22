"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// WAD file type. Either an IWAD ("Internal WAD") or a PWAD ("Patch WAD").
// Every WADFile must have a type. The type is represented in the first four
// bytes of any WAD file as an ASCII string. (Either "IWAD" or "PWAD".)
var WADFileType;
(function (WADFileType) {
    WADFileType[WADFileType["IWAD"] = 0] = "IWAD";
    WADFileType[WADFileType["PWAD"] = 1] = "PWAD";
    WADFileType[WADFileType["Invalid"] = 2] = "Invalid";
})(WADFileType = exports.WADFileType || (exports.WADFileType = {}));
// Implements functions for getting a WADFileType enum member from an
// ASCII string found in a WAD file header, and vice-versa.
(function (WADFileType) {
    function getName(type) {
        if (type === WADFileType.IWAD) {
            return "IWAD";
        }
        else if (type === WADFileType.PWAD) {
            return "PWAD";
        }
        else {
            return "????";
        }
    }
    WADFileType.getName = getName;
    function fromName(name) {
        if (name === "IWAD") {
            return WADFileType.IWAD;
        }
        else if (name === "PWAD") {
            return WADFileType.PWAD;
        }
        else {
            return WADFileType.Invalid;
        }
    }
    WADFileType.fromName = fromName;
})(WADFileType = exports.WADFileType || (exports.WADFileType = {}));
//# sourceMappingURL=fileType.js.map