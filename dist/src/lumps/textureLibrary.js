"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flat_1 = require("./doom/flat");
const textures_1 = require("./doom/textures");
const lump_1 = require("../wad/lump");
// Flats and walls use different texture sets.
var TextureSet;
(function (TextureSet) {
    TextureSet[TextureSet["Walls"] = 0] = "Walls";
    TextureSet[TextureSet["Flats"] = 1] = "Flats";
})(TextureSet = exports.TextureSet || (exports.TextureSet = {}));
function isWadTexture(texture, set) {
    return set === TextureSet.Walls;
}
exports.isWadTexture = isWadTexture;
function isWadFlat(texture, set) {
    return set === TextureSet.Flats;
}
exports.isWadFlat = isWadFlat;
class TextureLibrary {
    constructor(fileList) {
        this.fileList = fileList;
        this.textures = {
            [TextureSet.Walls]: {},
            [TextureSet.Flats]: {},
        };
        this.transparent = {
            [TextureSet.Walls]: {},
            [TextureSet.Flats]: {},
        };
        this.rgba = {
            [TextureSet.Walls]: {},
            [TextureSet.Flats]: {},
        };
    }
    isFlatMarker(lump) {
        const name = lump.name;
        return flat_1.WADFlat.IWADMarkerNames.includes(name) ||
            flat_1.WADFlat.PWADMarkerNames.includes(name) ||
            lump.dataLength === 0;
    }
    get(name, set) {
        // Get a texture, or add it to the library if it has not already been added
        // Already indexed, so return it immediately
        if (this.textures[set][name] !== undefined) {
            // A texture could missing from the texture lists and flat collections.
            console.log(`Using cached ${TextureSet[set]}[${name}]`);
            return this.textures[set][name];
        }
        console.log(`${TextureSet[set]}[${name}] is not in the library.`);
        // Wall textures are defined in TEXTUREx list entries
        if (set === TextureSet.Walls) {
            for (let textureListIndex = 1; textureListIndex <= 3; textureListIndex++) {
                const listName = `TEXTURE${textureListIndex}`;
                const listLump = this.fileList.map.get(listName);
                if (listLump) {
                    const texList = textures_1.WADTextures.from(listLump);
                    const texture = texList.getTextureByName(name);
                    if (texture) {
                        this.textures[set][name] = texture;
                        // this.transparent[set][name] = texture.isTransparent(this.fileList);
                        // this.rgba[set][name] = texture.getPixelDataRGBA(this.fileList);
                        return texture;
                    }
                }
            }
        }
        else if (set === TextureSet.Flats) {
            // Get lump
            const lump = this.fileList.map.get(name, lump_1.WADCategory.Flats);
            // Try to make a flat out of it
            // But set the library entry to null in case it doesn't exist
            this.textures[set][name] = null;
            try {
                if (lump != null) {
                    const flat = flat_1.WADFlat.from(lump);
                    this.textures[set][name] = flat;
                }
                else {
                    console.error("Lump is null");
                }
            }
            catch (error) {
                console.error(`Could not add ${TextureSet[set]}[${name}]:`, error);
            }
            return this.textures[set][name];
        }
        this.textures[set][name] = null;
        this.transparent[set][name] = null;
        this.rgba[set][name] = null;
        return null;
    }
    isTransparent(name, set) {
        // Lazily get whether or not the texture is transparent
        if (this.transparent[set][name]) {
            return this.transparent[set][name];
        }
        this.transparent[set][name] = false;
        const texture = this.textures[set][name];
        if (texture && isWadTexture(texture, set)) {
            const rgbaData = texture.getPixelDataRGBA(this.fileList);
            this.rgba[set][name] = rgbaData;
            for (let alphaOffset = 3; alphaOffset < rgbaData.length; alphaOffset += 4) {
                const alpha = rgbaData.readInt8(alphaOffset);
                if (alpha < 255) {
                    this.transparent[set][name] = true;
                    break;
                }
            }
        }
        // Flats cannot be transparent
        return this.transparent[set][name] || false;
    }
    getRgba(name, set) {
        // Lazily get the RGBA data for a texture
        if (this.rgba[set][name]) {
            return this.rgba[set][name];
        }
        const texture = this.textures[set][name];
        if (texture && isWadTexture(texture, set)) {
            this.rgba[set][name] = texture.getPixelDataRGBA(this.fileList);
            return this.rgba[set][name];
        }
        else if (texture && isWadFlat(texture, set)) {
            this.rgba[set][name] = texture.getPixelDataRGBA(this.fileList.getColors());
            return this.rgba[set][name];
        }
        return null;
    }
}
exports.TextureLibrary = TextureLibrary;
exports.default = TextureLibrary;
//# sourceMappingURL=textureLibrary.js.map