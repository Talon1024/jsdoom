"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lump_1 = require("../../wad/lump");
const string_1 = require("../../wad/string");
const patches_1 = require("./patches");
const picture_1 = require("./picture");
// Represents a single texture from a TEXTURE lump.
class WADTexture {
    constructor(options) {
        this.name = options.name;
        this.flags = options.flags;
        this.width = options.width;
        this.height = options.height;
        this.columnDirectory = options.columnDirectory;
        this.patches = options.patches;
    }
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(files, colors) {
        const useColors = colors || files.getColors();
        // Create the pixel data: size in pixels * 4 color channels
        const data = Buffer.alloc(this.width * this.height * 4, 0);
        // Get texture patches as WADPicture objects.
        const pictures = this.getPatchPictures(files);
        // Store patch posts in memory so that they don't have to be
        // constantly recomputed.
        const posts = this.getPatchPosts(pictures);
        console.log(this.patches);
        console.log(pictures);
        // console.log(pictures.map(p => p && `${p.x}, ${p.y}`));
        // Enumerate each pixel in the output image
        // Pixels not covered by any patch are skipped; they will remain
        // as 0x00000000, i.e. correctly transparent.
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                // Find the last (topmost) patch to intersect this pixel
                EnumeratePatches: for (let patchIndex = this.patches.length - 1; patchIndex >= 0; patchIndex--) {
                    // Picture data for this patch
                    const picPatch = pictures[patchIndex];
                    if (!picPatch) {
                        continue;
                    }
                    // Offset data for this patch
                    const texPatch = this.patches[patchIndex];
                    // Check if pixel is within the bounds of the patch
                    // First compute X and Y coordinate within this patch
                    const patchX = x - (texPatch.x);
                    const patchY = y - (texPatch.y);
                    if (patchX < 0 || patchX >= picPatch.width ||
                        patchY < 0 || patchY >= picPatch.height) {
                        continue;
                    }
                    // Find the post intersecting this pixel, if any
                    for (const post of posts[patchIndex][patchX]) {
                        // Check if this post intersects
                        if (!post || (post.y > patchY || post.y + post.length <= patchY)) {
                            continue;
                        }
                        // It does!
                        const postIndex = patchY - post.y;
                        const colorIndex = post.data.readUInt8(postIndex);
                        const colorRGBA = useColors.getColorRGBA(colorIndex);
                        const pixelIndex = x + (this.width * y);
                        data.writeUInt32LE(colorRGBA, 4 * pixelIndex);
                        // Move on to the next pixel
                        break EnumeratePatches;
                    }
                }
            }
        }
        // All done
        return data;
    }
    // Get a list of WADPicture objects corresponding to the texture's
    // patch list. Array indexes which correspond to unknown or invalid
    // patches will be populated with null values.
    getPatchPictures(files) {
        // Get the PNAMES lump since texture patches are referenced by
        // their index in the PNAMES patch table.
        const patchesLump = files.map.get("PNAMES");
        if (!patchesLump) {
            throw new Error("Found no PNAMES lump.");
        }
        const patches = patches_1.WADPatches.from(patchesLump);
        // Map texture patches to valid picture lumps, or null for missing
        // or invalid patches.
        const pictures = [];
        GetPicture: for (const patch of this.patches) {
            const name = patches.getPatchName(patch.patchIndex);
            // Check if this is a duplicate and use the same WADPicture
            // object if so
            for (const picture of pictures) {
                if (picture && name === picture.name) {
                    pictures.push(picture);
                    continue GetPicture;
                }
            }
            // Otherwise, look for the patch lump
            // Search for the patch lump in the patches category (between patch
            // start/end markers)
            let lump = files.map.get(name, lump_1.WADCategory.Patches);
            // If it isn't there, look outside of the patches category
            if (!lump) {
                lump = files.map.get(name);
            }
            // Lump is not in the WADs in the file list
            if (!lump) {
                pictures.push(null);
                continue;
            }
            try {
                const picture = picture_1.WADPicture.from(lump);
                pictures.push(picture);
                // Lump was invalid
            }
            catch (error) {
                pictures.push(null);
            }
        }
        // All done
        return pictures;
    }
    // Internal helper used by getPixelDataRGBA.
    // Computes all posts for all patches in the texture and stores them
    // in an array. The output array is indexed like so:
    // patchData[patchIndex][columnIndex][postIndex];
    // At patch indexes which corresponded to a missing/invalid patch,
    // the columns array will be empty. To illustrate:
    // patchData[invalidPatchIndex] === [];
    getPatchPosts(patches) {
        // TODO: only compute posts once per unique WADPicture; use the
        // same array reference for duplicate apperances
        const posts = [];
        for (const patch of patches) {
            if (patch) {
                const columns = [];
                const patchWidth = patch.width;
                posts.push(columns);
                for (let colIndex = 0; colIndex < patchWidth; colIndex++) {
                    columns.push(Array.from(patch.enumerateColumnPosts(colIndex)));
                }
            }
            else {
                posts.push([]);
            }
        }
        return posts;
    }
    // Tell whether or not this texture has transparent pixels in it
    isTransparent(files) {
        const patchPictures = this.getPatchPictures(files);
        const patchPosts = this.getPatchPosts(patchPictures);
        // Set up alpha map
        const data = new Uint8Array(this.width * this.height);
        // Blit alpha channel of patch on to alpha map
        for (let patchIndex = this.patches.length - 1; patchIndex >= 0; patchIndex--) {
            const y = this.patches[patchIndex].y;
            if (y >= this.height) {
                break;
            } // Outside of texture Y bounds
            for (let column = 0; column < patchPosts[patchIndex].length; column++) {
                const x = column + this.patches[patchIndex].x;
                if (x >= this.width) {
                    break;
                } // Outside of texture X bounds
                for (const post of patchPosts[patchIndex][column]) {
                    for (let pixelY = post.y + y; pixelY < post.length + post.y + y; pixelY++) {
                        if (pixelY >= this.height) {
                            break;
                        }
                        data[pixelY * this.width + x] = 255;
                    }
                }
            }
        }
        // Look at data and see if any pixels are transparent
        for (let i = 0; i < data.length; i++) {
            if (data[i] < 255) {
                // console.log(`${this.name} is transparent.`);
                return true;
            }
        }
        return false;
    }
    get worldPanning() {
        return (this.flags & 0x8000) > 0;
    }
}
exports.WADTexture = WADTexture;
// Represents a textures ("TEXTURE1" or "TEXTURE2") lump.
// Textures tell the engine how to combine patches in order to form wall
// textures.
// See: https://doomwiki.org/wiki/TEXTURE1_and_TEXTURE2
class WADTextures {
    constructor(data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as textures.
    // Returns false otherwise.
    static match(lump) {
        const upperName = lump.name.toUpperCase();
        return lump.length >= 4 && (upperName.startsWith(WADTextures.LumpNamePrefix) &&
            "0123456789".indexOf(upperName[upperName.length - 1]) >= 0);
    }
    // Create a WADTextures given a WADLump object.
    static from(lump) {
        if (!this.match(lump)) {
            throw new Error("Not a valid TEXTURE lump.");
        }
        return new WADTextures(lump.data);
    }
    // Get the number of textures represented in the lump.
    get length() {
        return this.data.readUInt32LE(0);
    }
    // Get a WADTexture by its name. Names are matched case-insensitively.
    // Returns the first matching texture.
    // Returns null if the name doesn't match any textures.
    getTextureByName(name) {
        const upperName = name.toUpperCase();
        const length = this.length;
        for (let texIndex = 0; texIndex < length; texIndex++) {
            const texOffset = this.data.readUInt32LE(4 + (4 * texIndex));
            const texName = string_1.readPaddedString8(this.data, texOffset);
            if (upperName === texName.toUpperCase()) {
                return this.readTextureAt(texOffset);
            }
        }
        return null;
    }
    // Enumerate all textures in the lump.
    *enumerateTextures() {
        const length = this.length;
        for (let texIndex = 0; texIndex < length; texIndex++) {
            const texOffset = this.data.readUInt32LE(4 + (4 * texIndex));
            yield this.readTextureAt(texOffset);
        }
    }
    // Helper to read the WADTexture at an offset in the lump.
    // Intended for internal use.
    readTextureAt(texOffset) {
        // Read the patch list
        const patchCount = this.data.readUInt16LE(texOffset + 20);
        const patches = [];
        for (let patchIndex = 0; patchIndex < patchCount; patchIndex++) {
            const patchOffset = texOffset + 22 + (10 * patchIndex);
            patches.push({
                x: this.data.readInt16LE(patchOffset),
                y: this.data.readInt16LE(patchOffset + 2),
                patchIndex: this.data.readUInt16LE(patchOffset + 4),
                mirrored: this.data.readUInt16LE(patchOffset + 6),
                colormap: this.data.readUInt16LE(patchOffset + 8),
            });
        }
        // Read and return the texture object
        return new WADTexture({
            name: string_1.readPaddedString8(this.data, texOffset),
            flags: this.data.readUInt32LE(texOffset + 8),
            width: this.data.readUInt16LE(texOffset + 12),
            height: this.data.readUInt16LE(texOffset + 14),
            columnDirectory: this.data.readUInt32LE(texOffset + 16),
            patches: patches,
        });
    }
}
exports.WADTextures = WADTextures;
// Texture lumps should always be named "TEXTURE1" or "TEXTURE2".
// jsdoom is extra permissive and allows "TEXTURE3" through "TEXTURE9";
// DelphiDoom supports a "TEXUTRE3" lump, so this isn't entirely novel.
WADTextures.LumpNamePrefix = "TEXTURE";
exports.default = WADTextures;
//# sourceMappingURL=textures.js.map