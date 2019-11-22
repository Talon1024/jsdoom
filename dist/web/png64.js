"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UPNG = require("upng-js");
const flat_1 = require("@src/lumps/doom/flat");
const picture_1 = require("@src/lumps/doom/picture");
const textures_1 = require("@src/lumps/doom/textures");
const png_1 = require("@src/lumps/zdoom/png");
const win = window;
// Base 64 digits ordered from lowest to greatest value.
exports.digits64 = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
// Convert the low three bytes of the input to a string of four base64 digits.
function btoa24(bits) {
    return (exports.digits64[(bits >> 18) & 0x3f] +
        exports.digits64[(bits >> 12) & 0x3f] +
        exports.digits64[(bits >> 6) & 0x3f] +
        exports.digits64[bits & 0x3f]);
}
// Convert the data in a buffer to base64-encoded data represented in a string.
function bufferbtoa(buffer) {
    const parts = [];
    let index = 0;
    // Process in 3-byte chunks
    while (index + 4 <= buffer.length) {
        const bits = buffer.readUInt32BE(index) >> 8;
        parts.push(btoa24(bits));
        index += 3;
    }
    // Process the last 3 bytes
    if (index + 3 === buffer.length) {
        const bits = ((buffer.readUInt16BE(index) << 8) +
            buffer.readUInt8(index + 2));
        parts.push(btoa24(bits));
        // Or process the last 2 bytes
    }
    else if (index + 2 === buffer.length) {
        const bits = buffer.readUInt16BE(index);
        parts.push(exports.digits64[bits >> 10] +
            exports.digits64[(bits >> 4) & 0x3f] +
            exports.digits64[(bits << 2) & 0x3f] +
            "=");
        // Or process the last 1 byte
    }
    else if (index + 1 === buffer.length) {
        const bits = buffer.readUInt8(index);
        parts.push(exports.digits64[bits >> 2] +
            exports.digits64[(bits << 4) & 0x3F] +
            "==");
    }
    // Put it all together and return it
    return parts.join("");
}
exports.bufferbtoa = bufferbtoa;
// Helper to get base-64 encoded PNG data from a Doom graphic.
// This is used to display images in the browser.
// TODO: Possibly cache the results?
function getPng64(files, graphic) {
    if (graphic instanceof flat_1.WADFlat) {
        const colors = files.getColors();
        const pixels = graphic.getPixelDataRGBA(colors);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }
    else if (graphic instanceof picture_1.WADPicture) {
        const colors = files.getColors();
        const pixels = graphic.getPixelDataRGBA(colors);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }
    else if (graphic instanceof textures_1.WADTexture) {
        const pixels = graphic.getPixelDataRGBA(files);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }
    else if (graphic instanceof png_1.WADPng) {
        // const pngString: string = String.fromCharCode(...graphic.data);
        // const data64: string = btoa(pngString);
        const data64 = bufferbtoa(graphic.data);
        return `data:image/png;base64,${data64}`;
    }
    else {
        throw new Error("Unknown graphic type.");
    }
}
exports.getPng64 = getPng64;
// Helper used by getPng64 function
// Accepts an RGBA pixels buffer and the image dimensions.
// Outputs base-64 encoded PNG data for display e.g. in an `img` DOM element.
function getPng64FromPixelData(pixels, width, height) {
    const png = UPNG.encode([pixels.buffer], width, height, 0);
    // TODO: Is this *really* the best way to do this?
    // const data64: string = btoa(String.fromCharCode(...new Uint8Array(png)));
    const data64 = bufferbtoa(Buffer.from(png));
    return `data:image/png;base64,${data64}`;
}
exports.default = getPng64;
//# sourceMappingURL=png64.js.map