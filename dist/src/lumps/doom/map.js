"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapLines_1 = require("./mapLines");
const mapSectors_1 = require("./mapSectors");
const mapSides_1 = require("./mapSides");
const mapThings_1 = require("./mapThings");
const mapThingType_1 = require("./mapThingType");
const mapVertexes_1 = require("./mapVertexes");
// Data structure which wraps several lumps together
// making up a single map.
class WADMap {
    constructor(name) {
        this.name = name;
        this.things = null;
        this.lines = null;
        this.sides = null;
        this.vertexes = null;
        this.segments = null;
        this.subsectors = null;
        this.nodes = null;
        this.sectors = null;
        this.reject = null;
        this.blockmap = null;
        this.behavior = null;
    }
    // Returns true when a WADLump is a map marker.
    // Returns false otherwise.
    // This function is slightly more permissive than vanilla
    // Doom 1 & 2.
    // TODO: Should this function look for a MAPINFO lump and
    // use that to find additional map marker names?
    static match(lump) {
        if (lump.length !== 0) {
            return false;
        }
        const name = lump.name.toUpperCase();
        return (
        // MAPxx
        (name.length >= 5 && name.startsWith("MAP")) ||
            // ExMx
            (name.length >= 4 && name[0] === "E" && name[2] === "M"));
    }
    // Find the map marker lump corresponding to some map related lump,
    // for example given the "THINGS" or "LINEDEFS" lump as input.
    // May behave unexpectedly for inputs that are not actually map-related.
    // Returns null if no corresponding map marker could be found.
    static findMarker(mapLump) {
        if (WADMap.match(mapLump)) {
            return mapLump;
        }
        for (const lump of mapLump.enumeratePreviousLumps()) {
            if (WADMap.match(lump)) {
                return lump;
            }
        }
        return null;
    }
    // Create a WADMapVertexes given a WADLump object.
    // The WADLump must be the map marker lump.
    // The function will look for THINGS, LINEDEFS, etc. lumps in between
    // this map marker and the next lump not recognized as belonging to
    // the map.
    static from(markerLump) {
        const map = new WADMap(markerLump.name);
        for (const lump of markerLump.enumerateNextLumps()) {
            const name = lump.name.toUpperCase();
            if (name === mapThings_1.WADMapThings.LumpName) { // THINGS
                map.things = mapThings_1.WADMapThings.from(lump);
            }
            else if (name === mapLines_1.WADMapLines.LumpName) { // LINEDEFS
                map.lines = mapLines_1.WADMapLines.from(lump);
            }
            else if (name === mapSides_1.WADMapSides.LumpName) { // SIDEDEFS
                map.sides = mapSides_1.WADMapSides.from(lump);
            }
            else if (name === mapVertexes_1.WADMapVertexes.LumpName) { // VERTEXES
                map.vertexes = mapVertexes_1.WADMapVertexes.from(lump);
            }
            else if (name === "SEGS") { // SEGS
                map.segments = lump;
            }
            else if (name === "SSECTORS") { // SSECTORS
                map.subsectors = lump;
            }
            else if (name === "NODES") { // NODES
                map.nodes = lump;
            }
            else if (name === mapSectors_1.WADMapSectors.LumpName) { // SECTORS
                map.sectors = mapSectors_1.WADMapSectors.from(lump);
            }
            else if (name === "REJECT") { // REJECT
                map.reject = lump;
            }
            else if (name === "BLOCKMAP") { // BLOCKMAP
                map.blockmap = lump;
            }
            else if (name === "BEHAVIOR") { // BEHAVIOR (Hexen, ZDoom)
                map.behavior = lump;
            }
            else if (name === "TEXTMAP") { // TEXTMAP (ZDoom)
                // TODO: Load UDMF maps
            }
            else if (name === "ZNODES") { // ZNODES (ZDoom)
                // TODO: Load UDMF maps
            }
            else if (name === "DIALOGUE") { // DIALOGUE (ZDoom)
                // TODO: Load UDMF maps
            }
            else { // Exit upon seeing anything else (including ENDMAP)
                break;
            }
        }
        return map;
    }
    // Get the minimum and maximum X and Y vertex coordinates,
    // i.e. a minimum bounding box.
    // Returns an empty bounding box centered on the origin if there
    // were no vertexes in the map.
    getBoundingBox() {
        if (!this.vertexes) {
            return new mapVertexes_1.WADMapBoundingBox(0, 0, 0, 0);
        }
        else {
            return this.vertexes.getBoundingBox();
        }
    }
    // Enumerate all linedefs in the map.
    enumerateThings() {
        if (this.things) {
            return this.things.enumerateThings();
        }
        else {
            return [];
        }
    }
    // Enumerate all linedefs in the map.
    enumerateLines() {
        if (this.lines) {
            return this.lines.enumerateLines();
        }
        else {
            return [];
        }
    }
    // Enumerate all vertexes in the map.
    enumerateVertexes() {
        if (this.vertexes) {
            return this.vertexes.enumerateVertexes();
        }
        else {
            return [];
        }
    }
    // Get the start position for the given player
    getPlayerStart(player) {
        let playerStart = null;
        for (const thing of this.enumerateThings()) {
            if (!mapThingType_1.WADMapThingTypeMap[thing.type]) {
                continue;
            }
            if (mapThingType_1.WADMapThingTypeMap[thing.type].class === mapThingType_1.WADMapThingClass.PlayerStart &&
                thing.type === player) { // Doom player starts have the same DoomEdNum as the player
                playerStart = thing;
            }
        }
        // Use the last player start.
        // Other player starts for the same player are voodoo dolls.
        return playerStart;
    }
}
exports.WADMap = WADMap;
//# sourceMappingURL=map.js.map