"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represents a patch, sprite, or interface graphic using the vanilla Doom
// engine's picture format.
// See https://doomwiki.org/wiki/Picture_format
class WADPicture {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    // Returns true when a WADLump can be read as a picture.
    // Returns false otherwise.
    static match(lump) {
        // Make sure the lump is long enough to hold the header
        if (!lump.data || lump.length < 8) {
            return false;
        }
        // Check that the image dimensions make sense
        const width = lump.data.readUInt16LE(0);
        const height = lump.data.readUInt16LE(2);
        if (width <= 0 || width > 4096 || height <= 0 || height > 4096) {
            return false;
        }
        // Make sure all of the column pointers are valid
        const colOffsetsEnd = 8 + 4 * width;
        if (lump.length < colOffsetsEnd) {
            return false;
        }
        for (let colIndex = 0; colIndex < width; colIndex++) {
            const colOffset = lump.data.readUInt32LE(8 + (4 * colIndex));
            if (colOffset < colOffsetsEnd || colOffset >= lump.data.length) {
                return false;
            }
        }
        // Check each post for correctness
        for (let colIndex = 0; colIndex < width; colIndex++) {
            let dataOffset = lump.data.readUInt32LE(8 + (4 * colIndex));
            while (true) {
                const postOffset = lump.data.readUInt8(dataOffset);
                if (postOffset === 0xff) {
                    break;
                }
                const length = lump.data.readUInt8(dataOffset + 1);
                dataOffset += length + 4;
                if (dataOffset >= lump.data.length) {
                    return false;
                }
            }
        }
        // This is (probably) a valid picture lump
        return true;
    }
    // Create a WADPicture given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid picture lump.");
        }
        return new WADPicture(lump.name, lump.data);
    }
    // Get the width of the picture in pixels.
    get width() {
        return this.data.readUInt16LE(0);
    }
    // Get the height of the picture in pixels.
    get height() {
        return this.data.readUInt16LE(2);
    }
    // Get the X offset of the picture in pixels.
    get x() {
        return this.data.readInt16LE(4);
    }
    // Get the Y offset of the picture in pixels.
    get y() {
        return this.data.readInt16LE(6);
    }
    // Count the number of unique colors in the picture.
    countColors() {
        const colors = [];
        let count = 0;
        for (const post of this.enumeratePosts()) {
            for (let postIndex = 0; postIndex < post.length; postIndex++) {
                const colorIndex = post.data.readUInt8(postIndex);
                if (!colors[colorIndex]) {
                    colors[colorIndex] = true;
                    count++;
                }
            }
        }
        return count;
    }
    // Get the pixel color index at a coordinate.
    // Returns -1 if this is a transparent pixel.
    getPixel(x, y) {
        // Enumerate the posts in the requested column and look for a post
        // which includes the requested pixel.
        for (const post of this.enumerateColumnPosts(x)) {
            if (post.y <= y && post.y + post.length > y) {
                return post.data.readUInt8(y - post.y);
            }
        }
        // Pixel wasn't found in any of this columns posts;
        // this means that the pixel is missing/transparent.
        return -1;
    }
    // True when the picture contains any transparent pixels.
    // Returns false when all pixels are opaque.
    hasTransparency() {
        const width = this.width;
        // Enumerate the posts in each column
        for (let colIndex = 0; colIndex < width; colIndex++) {
            let lastEndOffset = 0;
            for (const post of this.enumerateColumnPosts(colIndex)) {
                // Compare the starting Y offset of this post to the end
                // of the last post, or to 0 if this is the first post.
                if (post.y != lastEndOffset) {
                    return true;
                }
                lastEndOffset = post.y + post.length;
            }
        }
        // All done: found no transparency.
        return false;
    }
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(colors) {
        // Create the pixel data: size in pixels * 4 color channels
        const width = this.width;
        const height = this.height;
        const data = Buffer.alloc(width * height * 4, 0);
        // Fill the array from post data
        // Pixels in between posts will be skipped; it will remain 0x00000000,
        // i.e. correctly transparent.
        for (const post of this.enumeratePosts()) {
            for (let postIndex = 0; postIndex < post.length; postIndex++) {
                const colorIndex = post.data.readUInt8(postIndex);
                const colorRGBA = colors.getColorRGBA(colorIndex);
                const pixelIndex = post.x + (width * (postIndex + post.y));
                data.writeUInt32LE(colorRGBA, 4 * pixelIndex);
            }
        }
        // All done
        return data;
    }
    // Enumerate a list of posts which make up the image data.
    *enumeratePosts() {
        const width = this.width;
        // Enumerate the posts in each column
        for (let colIndex = 0; colIndex < width; colIndex++) {
            for (const post of this.enumerateColumnPosts(colIndex)) {
                yield post;
            }
        }
    }
    // Enumerate a list of posts which make up a column of the image data.
    *enumerateColumnPosts(colIndex) {
        // Read the in-lump offset where this column's post data begins
        let dataOffset = this.data.readUInt32LE(8 + (4 * colIndex));
        let lastPostOffset = 0;
        // Keep reading posts until either:
        // - Ran into a terminating post offset value (0xff)
        // - There's no more data in the lump (shouldn't happen)
        while (dataOffset + 1 < this.data.length) {
            const postOffset = this.data.readUInt8(dataOffset);
            // Special value of 255 is the terminator (no more data)
            if (postOffset === 0xff) {
                break;
            }
            // Get the size of this post (and compute the start of the next one)
            const postLength = this.data.readUInt8(dataOffset + 1);
            const nextDataOffset = dataOffset + postLength + 4;
            // Account for DeePsea tall patches:
            // If this post's y offset is less than or equal to the previous
            // offset, then the true offset is their sum.
            const yPosition = (postOffset <= lastPostOffset ?
                postOffset + lastPostOffset : postOffset);
            // Yield the post's data...
            // Note that there is a single byte of padding between the post
            // length byte and the first pixel data byte, and another byte of
            // padding between the last pixel data byte and the following post.
            // The first padding byte is the same as the first byte in the
            // post's pixel data and the second padding byte is the same as
            // the last byte in the post's pixel data.
            yield {
                offset: postOffset,
                length: postLength,
                x: colIndex,
                y: yPosition,
                data: this.data.slice(dataOffset + 3, nextDataOffset - 1),
            };
            // Get ready to read the next post
            dataOffset = nextDataOffset;
            lastPostOffset = yPosition;
        }
    }
}
exports.WADPicture = WADPicture;
exports.default = WADPicture;
//# sourceMappingURL=picture.js.map