"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Represets an axis-aligned box with left, right, top,
// and bottom coordinates.
// TODO: Perhaps this should live in a common module?
class WADMapBoundingBox {
    constructor(left, top, right, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
    // Get the total width of the box.
    get width() {
        return this.right - this.left;
    }
    // Get the total height of the box.
    get height() {
        return this.bottom - this.top;
    }
}
exports.WADMapBoundingBox = WADMapBoundingBox;
// Represents a single vertex read from a Doom format VERTEXES lump.
class WADMapVertex {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
    }
}
exports.WADMapVertex = WADMapVertex;
// Represents a Doom format "VERTEXES" lump.
// See: https://doomwiki.org/wiki/Vertexdef
class WADMapVertexes {
    constructor(name, data) {
        this.data = data;
    }
    // Returns true when a WADLump can be read as map vertexes.
    // Returns false otherwise.
    static match(lump) {
        return lump.length % WADMapVertexes.ItemSize === 0 && (lump.name.toUpperCase() === WADMapVertexes.LumpName);
    }
    // Create a WADMapVertexes given a WADLump object.
    static from(lump) {
        return new WADMapVertexes(lump.name, lump.data);
    }
    // Get the number of vertexes represented in the lump.
    get length() {
        return Math.floor(this.data.length / WADMapVertexes.ItemSize);
    }
    // Get the minimum and maximum X and Y vertex coordinates,
    // i.e. a minimum bounding box.
    // Returns an empty bounding box centered on the origin if there
    // were no vertexes in the lump.
    getBoundingBox() {
        const length = this.length;
        // Handle the special case where there are no vertexes in the lump
        if (!length) {
            return new WADMapBoundingBox(0, 0, 0, 0);
        }
        // Initialize values from the first vertex
        const first = this.getVertex(0);
        let left = first.x;
        let right = first.x;
        let top = first.y;
        let bottom = first.y;
        // Enumerate the remaining vertexes
        for (let vertexIndex = 1; vertexIndex < length; vertexIndex++) {
            const vertex = this.getVertex(vertexIndex);
            left = Math.min(left, vertex.x);
            right = Math.max(right, vertex.x);
            top = Math.min(top, vertex.y);
            bottom = Math.max(bottom, vertex.y);
        }
        // All done
        return new WADMapBoundingBox(left, top, right, bottom);
    }
    // Get the vertex at an index.
    getVertex(vertexIndex) {
        if (vertexIndex < 0 || vertexIndex >= this.length) {
            throw new Error("Vertex index out of bounds.");
        }
        const vertexOffset = WADMapVertexes.ItemSize * vertexIndex;
        return new WADMapVertex({
            x: this.data.readInt16LE(vertexOffset),
            y: this.data.readInt16LE(vertexOffset + 2),
        });
    }
    // Enumerate all of the vertexes in the lump.
    *enumerateVertexes() {
        const length = this.length;
        for (let vertexIndex = 0; vertexIndex < length; vertexIndex++) {
            yield this.getVertex(vertexIndex);
        }
    }
}
exports.WADMapVertexes = WADMapVertexes;
// Map vertex lumps are always named "VERTEXES".
WADMapVertexes.LumpName = "VERTEXES";
// The number of bytes which make up each vertex in the lump.
WADMapVertexes.ItemSize = 4;
exports.default = WADMapVertexes;
//# sourceMappingURL=mapVertexes.js.map