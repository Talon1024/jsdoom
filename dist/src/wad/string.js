"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Read a null-padded ASCII string from a data buffer at an offset
// of arbitrary length.
function readPaddedString(data, offset, length) {
    let text = "";
    let i = offset;
    const end = offset + length;
    while (i < end) {
        const char = data.readUInt8(i++);
        if (char !== 0) {
            text += String.fromCharCode(char);
        }
        else {
            break;
        }
    }
    return text;
}
exports.readPaddedString = readPaddedString;
// Read an 8-character null-padded ASCII string from a data buffer
// at an offset.
function readPaddedString8(data, offset) {
    const bytes = data.slice(offset, offset + 8);
    const text = Array.from(bytes).map((character) => {
        return String.fromCharCode(character & 0xff);
    }).join("");
    // Chop off useless bytes - Fixes Memento Mori (MM.WAD)
    for (let index = 0; index < 8; index++) {
        if (data[index + offset] === 0) {
            return text.substring(0, index);
        }
    }
    return text;
}
exports.readPaddedString8 = readPaddedString8;
// Write a null-padded ASCII string to a data buffer.
function writePaddedString(data, offset, length, text) {
    let i = 0;
    while (i < text.length && i < length) {
        data.writeUInt8(text.charCodeAt(i), offset + i);
        i++;
    }
    while (i < length) {
        data.writeUInt8(0, offset + i);
        i++;
    }
}
exports.writePaddedString = writePaddedString;
//# sourceMappingURL=string.js.map