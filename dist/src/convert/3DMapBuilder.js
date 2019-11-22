"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
const textureLibrary_1 = require("../lumps/textureLibrary");
// Represents a boundary between two sectors
function getSideHeights(frontSector, backSector) {
    // const ceilingDiff = frontSector.ceilingHeight - backSector.ceilingHeight;
    // const floorDiff = frontSector.floorHeight - backSector.floorHeight;
    const middleTop = Math.min(frontSector.ceilingHeight, backSector.ceilingHeight);
    const middleBottom = Math.max(frontSector.floorHeight, backSector.floorHeight);
    return {
        middleTop,
        middleBottom,
        front: {
            upperTop: frontSector.ceilingHeight,
            upperBottom: middleTop,
            lowerTop: middleBottom,
            lowerBottom: frontSector.floorHeight,
        },
        back: {
            upperTop: backSector.ceilingHeight,
            upperBottom: middleTop,
            lowerTop: middleBottom,
            lowerBottom: backSector.floorHeight
        }
    };
}
class SectorPolygonBuilder {
    constructor(sectorLines, mapVertices, debug = false) {
        // Get sector edges
        this.sectorEdges = [];
        this.edgesLeft = {};
        for (const line of sectorLines) {
            const edge = [line.startVertex, line.endVertex];
            // Ensure duplicate edges are not added
            const edgeDuplicate = [line.endVertex, line.startVertex];
            if (!this.sectorEdges.includes(edge) &&
                !this.sectorEdges.includes(edgeDuplicate)) {
                this.sectorEdges.push([line.startVertex, line.endVertex]);
                this.edgesLeft[edge.join(" ")] = false;
            }
        }
        // Sector vertices
        this.mapVertices = mapVertices;
        this.debug = debug;
    }
    // Get the clockwise or counterclockwise angle between three points
    static angleBetween(p1, center, p2, clockwise = false) {
        // Rewritten to be simpler and work better with the THREE.js API
        const ab = p1.clone().sub(center).normalize();
        const cb = p2.clone().sub(center).normalize();
        // Dot and cross product of the two vectors
        const dot = ab.dot(cb);
        const cross = ab.cross(cb);
        // Angle - will always be positive
        return Math.atan2(clockwise ? cross : -cross, -dot) + Math.PI;
    }
    // Get sector vertex info (map index)
    vertexFor(vertexIndex) {
        const { x, y } = this.mapVertices[vertexIndex];
        return {
            index: vertexIndex,
            position: new THREE.Vector2(x, -y),
        };
    }
    findNextStartEdge(clockwise = false) {
        // Filter out vertices to skip
        const usableEdges = this.sectorEdges.filter((edge) => {
            // Ensure I pick an edge which has not been added.
            return this.edgesLeft[edge.join(" ")] === false;
        });
        if (usableEdges.length === 0) {
            return null;
        }
        // Get positions for all usable vertices
        const usableVertices = usableEdges.reduce((vertices, edge) => {
            return vertices.concat(edge.filter((edgeVertex) => !vertices.includes(edgeVertex)));
        }, usableEdges[0]).map((vertexIndex) => this.vertexFor(vertexIndex));
        // And then find the upper rightmost vertex among them
        const rightMostVertex = usableVertices.reduce((currentRightMostVertex, nextVertex) => {
            // X is greater
            if (nextVertex.position.x > currentRightMostVertex.position.x) {
                return nextVertex;
            }
            else if (nextVertex.position.x === currentRightMostVertex.position.x) {
                // X is the same, but Y may be different
                // Y is inverted in vertexFor
                if (nextVertex.position.y < currentRightMostVertex.position.y) {
                    return nextVertex;
                }
            }
            return currentRightMostVertex;
        }, usableVertices[0]);
        // Find edges connected to the rightmost vertex
        const rightMostEdges = this.sectorEdges.filter((edge) => {
            if (edge.includes(rightMostVertex.index)) {
                // Ensure no used edges are picked
                return this.edgesLeft[edge.join(" ")] === false;
            }
            return false;
        });
        // Get vertices connected to the rightmost vertex
        const rightMostConnectedVertices = rightMostEdges.map((edge) => edge[0] === rightMostVertex.index ? edge[1] : edge[0]).map((vertexIndex) => this.vertexFor(vertexIndex));
        // Get lowermost rightmost vertex out of those
        const otherVertex = rightMostConnectedVertices.reduce((currentLowestVertex, nextVertex) => {
            if (nextVertex.position.y > currentLowestVertex.position.y) {
                // Lowest Y (Y coordinate is inverted)
                return nextVertex;
            }
            else if (nextVertex.position.y === currentLowestVertex.position.y) {
                // Y is the same, X may be different
                if (nextVertex.position.x > currentLowestVertex.position.x) {
                    return nextVertex;
                }
            }
            return currentLowestVertex;
        }, rightMostConnectedVertices[0]);
        return [rightMostVertex.index, otherVertex.index];
    }
    findNextVertex(from, previous, clockwise = false) {
        // Find all edges that:
        // - Have not been added to a polygon
        // - Are attached to the "from" vertex
        // - Are not the "previous" vertex
        const edges = this.sectorEdges.filter((edge) => {
            if (this.edgesLeft[edge.join(" ")] === true) {
                return false;
            }
            if (edge.includes(from) && !edge.includes(previous)) {
                return true;
            }
            return false;
        });
        if (edges.length > 1) {
            // Find the vertices that are attached to the edge
            const intersectionVertices = edges.map((edge) => {
                return edge.find((edgeVertex) => {
                    return edgeVertex !== from &&
                        edgeVertex !== previous;
                }) || null;
            }).filter((vertex) => vertex != null);
            // Find the vertex that is connected by the lowest angle
            let mostAcuteAngle = Math.PI * 2;
            let mostAcuteVertex = 0;
            const startVector = this.vertexFor(previous).position;
            const midVector = this.vertexFor(from).position;
            // Iterate through vertices, find which one has the lowest angle
            for (const vertexIndex of intersectionVertices) {
                const endVector = this.vertexFor(vertexIndex).position;
                const angle = SectorPolygonBuilder.angleBetween(endVector, midVector, startVector, clockwise);
                if (angle < mostAcuteAngle) {
                    mostAcuteAngle = angle;
                    mostAcuteVertex = vertexIndex;
                }
            }
            return mostAcuteVertex;
        }
        else if (edges.length === 1) {
            // There should be at least 1 vertex that comes next in the polygon
            const otherVertex = edges[0].find((edgeVertex) => {
                return edgeVertex !== from;
            });
            // otherVertex could be 0, and 0 || null === null.
            if (otherVertex === undefined) {
                return null;
            }
            return otherVertex;
        }
        return null;
    }
    // Checks whether or not the edge specified by the start and end vertices
    // exists. Returns the key string representing the edge if it does, or an
    // empty string if it does not.
    edgeExists(edgeStart, edgeEnd) {
        const edgeKey = `${edgeStart} ${edgeEnd}`;
        const reversedEdgeKey = `${edgeEnd} ${edgeStart}`;
        if (this.edgesLeft.hasOwnProperty(edgeKey)) {
            return edgeKey;
        }
        else if (this.edgesLeft.hasOwnProperty(reversedEdgeKey)) {
            return reversedEdgeKey;
        }
        return "";
    }
    // Marks the given edge as being added to a polygon
    // Returns whether or not the given edge exists
    visitEdge(edgeStart, edgeEnd) {
        const edgeKey = this.edgeExists(edgeStart, edgeEnd);
        if (edgeKey !== "") {
            this.edgesLeft[edgeKey] = true;
            return true;
        }
        return false;
    }
    isPolygonComplete(polygon, last) {
        if (polygon.length < 3) {
            // There is no such thing as a 2 sided polygon
            return false;
        }
        // First vertex of polygon
        const first = polygon[0];
        return last === first;
    }
    // Get the polygons that make up the sector, as indices in the VERTEXES lump
    getPolygons() {
        // Make a new array with the sector polygons
        const startEdge = this.findNextStartEdge();
        if (!startEdge) {
            return [];
        }
        if (this.debug) {
            console.log("starting edge", startEdge);
        }
        // Current polygon index
        let curPolygon = 0;
        // Polygon array
        // e.g. [[0, 1, 2, 3], [4, 5, 6, 7]]
        const sectorPolygons = [startEdge];
        while (this.sectorEdges.some((edge) => this.edgesLeft[edge.join(" ")] === false)) {
            // The vertex from which to start the search for the next vertex
            const [prevVertex, lastVertex] = sectorPolygons[curPolygon].slice(-2);
            this.visitEdge(prevVertex, lastVertex);
            // The next vertex to add to the polygon
            const nextVertex = this.findNextVertex(lastVertex, prevVertex);
            if (this.debug) {
                const vertexIndexStrings = [prevVertex, lastVertex, nextVertex].map((vertexIndex) => {
                    const indexString = vertexIndex == null ? "null" :
                        vertexIndex.toString(10);
                    // Doom map vertex indices are unsigned 16-bit integers,
                    // which are no more than 5 decimal digits
                    return indexString.padEnd(5, " ");
                });
                const vertexTypeStrings = ["pv", "ls", "nx"];
                const argumentArray = [];
                for (let i = 0; i < 3; i++) {
                    argumentArray.push(vertexTypeStrings[i], vertexIndexStrings[i]);
                }
                console.log(argumentArray.join(" "));
            }
            // No more vertices left in this polygon
            if (nextVertex == null || this.isPolygonComplete(sectorPolygons[curPolygon], nextVertex)) {
                if (!this.visitEdge(lastVertex, sectorPolygons[curPolygon][0])) {
                    // Last polygon is a dud
                    sectorPolygons.pop();
                    curPolygon -= 1;
                }
                // Find the first edge of the next polygon, and add it to the
                // polygons that make up this sector
                const nextStartEdge = this.findNextStartEdge();
                if (nextStartEdge == null) {
                    break;
                }
                if (this.debug) {
                    console.log("new polygon starting with", nextStartEdge);
                }
                // Go to the next polygon
                curPolygon += 1;
                sectorPolygons.push(nextStartEdge);
                // Mark the starting edge as added to the polygon
                this.visitEdge(nextStartEdge[0], nextStartEdge[1]);
            }
            else if (this.visitEdge(lastVertex, nextVertex)) {
                // There is another edge in the polygon, mark it as added.
                sectorPolygons[curPolygon].push(nextVertex);
            }
            else {
                // The polygon is a dud
                sectorPolygons.pop();
                curPolygon -= 1;
            }
        }
        // Check to see whether each polygon is complete, and remove incomplete
        // polygons.
        const completeSectorPolygons = sectorPolygons.filter((polygon) => {
            return this.edgeExists(polygon[0], polygon[polygon.length - 1]) !== "";
        });
        if (this.debug) {
            console.log(sectorPolygons);
            console.log(completeSectorPolygons);
        }
        return completeSectorPolygons;
    }
}
var BoundingBoxComparison;
(function (BoundingBoxComparison) {
    BoundingBoxComparison[BoundingBoxComparison["Within"] = 0] = "Within";
    BoundingBoxComparison[BoundingBoxComparison["Contains"] = 1] = "Contains";
    BoundingBoxComparison[BoundingBoxComparison["Outside"] = 2] = "Outside";
    BoundingBoxComparison[BoundingBoxComparison["Edge"] = 3] = "Edge";
})(BoundingBoxComparison || (BoundingBoxComparison = {}));
// Class for convenient comparisons and operations for bounding boxes
class BoundingBox {
    constructor(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    static from(vertices) {
        let minX = vertices[0].x;
        let minY = vertices[0].y;
        let maxX = vertices[0].x;
        let maxY = vertices[0].y;
        for (const vertex of vertices) {
            if (vertex.x < minX) {
                minX = vertex.x;
            }
            if (vertex.y < minY) {
                minY = vertex.y;
            }
            if (vertex.x > maxX) {
                maxX = vertex.x;
            }
            if (vertex.y > maxY) {
                maxY = vertex.y;
            }
        }
        return new BoundingBox(minX, minY, maxX, maxY);
    }
    // Determine whether this bounding box is within the other one, or otherwise contains the other one.
    compare(other) {
        if (this.minX < other.minX && this.maxX > other.maxX && this.minY < other.minY && this.maxY > other.maxY) {
            return BoundingBoxComparison.Contains;
        }
        else if (other.minX < this.minX && other.maxX > this.maxX && other.minY < this.minY && other.maxY > this.maxY) {
            return BoundingBoxComparison.Within;
        }
        else if ((this.minX < other.minX && this.maxX < other.maxX) || (this.minY < other.minY && this.maxY < other.maxY)) {
            return BoundingBoxComparison.Edge;
        }
        else {
            return BoundingBoxComparison.Outside;
        }
    }
    // Get the area of this bounding box - very simple math
    area() {
        const width = this.maxX - this.minX;
        const height = this.maxY - this.minY;
        return width * height;
    }
}
// Different alignment types for textures on a line quad
var TextureAlignmentType;
(function (TextureAlignmentType) {
    // Middle texture for one-sided walls, or upper or lower texture for two-sided walls
    TextureAlignmentType[TextureAlignmentType["Normal"] = 0] = "Normal";
    // Upper texture that is not unpegged
    TextureAlignmentType[TextureAlignmentType["Upper"] = 1] = "Upper";
    // Midtexture quad
    TextureAlignmentType[TextureAlignmentType["Midtexture"] = 2] = "Midtexture";
    // Back-side midtexture quad
    TextureAlignmentType[TextureAlignmentType["BackMidtexture"] = 3] = "BackMidtexture";
})(TextureAlignmentType = exports.TextureAlignmentType || (exports.TextureAlignmentType = {}));
// Different settings that apply to line quad texture alignment
var TextureAlignmentFlags;
(function (TextureAlignmentFlags) {
    TextureAlignmentFlags[TextureAlignmentFlags["Normal"] = 0] = "Normal";
    TextureAlignmentFlags[TextureAlignmentFlags["World"] = 1] = "World";
    TextureAlignmentFlags[TextureAlignmentFlags["LowerUnpegged"] = 2] = "LowerUnpegged";
    TextureAlignmentFlags[TextureAlignmentFlags["TwoSided"] = 4] = "TwoSided";
})(TextureAlignmentFlags = exports.TextureAlignmentFlags || (exports.TextureAlignmentFlags = {}));
// Whether a line quad is an upper, middle, lower, or 3D floor line quad.
// Currently used to help connect the vertices in an OBJ.
var LineQuadPlace;
(function (LineQuadPlace) {
    // Upper quad
    LineQuadPlace[LineQuadPlace["Upper"] = 0] = "Upper";
    // One-sided line quad
    LineQuadPlace[LineQuadPlace["Middle"] = 1] = "Middle";
    // Midtexture quad
    LineQuadPlace[LineQuadPlace["Midtexture"] = 2] = "Midtexture";
    // Lower quad
    LineQuadPlace[LineQuadPlace["Lower"] = 3] = "Lower";
    // 3D floor quad (same as middle, but with floor and ceiling swapped)
    LineQuadPlace[LineQuadPlace["ThreeDeeFloor"] = 4] = "ThreeDeeFloor";
})(LineQuadPlace = exports.LineQuadPlace || (exports.LineQuadPlace = {}));
// Whether a sector triangle is on the floor or ceiling
var SectorTrianglePlace;
(function (SectorTrianglePlace) {
    // Triangle is on the floor
    SectorTrianglePlace[SectorTrianglePlace["Floor"] = 0] = "Floor";
    // Triangle is on the ceiling
    SectorTrianglePlace[SectorTrianglePlace["Ceiling"] = 1] = "Ceiling";
    // The top of a 3D floor is a floor, and the bottom is a ceiling
})(SectorTrianglePlace = exports.SectorTrianglePlace || (exports.SectorTrianglePlace = {}));
// Which vertex of the quad
var QuadVertexPosition;
(function (QuadVertexPosition) {
    QuadVertexPosition[QuadVertexPosition["UpperLeft"] = 0] = "UpperLeft";
    QuadVertexPosition[QuadVertexPosition["UpperRight"] = 1] = "UpperRight";
    QuadVertexPosition[QuadVertexPosition["LowerLeft"] = 2] = "LowerLeft";
    QuadVertexPosition[QuadVertexPosition["LowerRight"] = 3] = "LowerRight";
})(QuadVertexPosition = exports.QuadVertexPosition || (exports.QuadVertexPosition = {}));
// This class takes map data, and creates a 3D mesh from it.
class MapGeometryBuilder {
    constructor(map) {
        this.map = map;
        this.vertices = [];
    }
    // Point-in-polygon algorithm - used to find out whether a contiguous set
    // of vertices is a hole in a sector polygon
    static pointInPolygon(point, polygon) {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
        // Code from https://github.com/substack/point-in-polygon/blob/96ef4abc2a623c98214618418e42a68240055f2e/index.js
        // Licensed under MIT license
        // (c) 2011 James Halliday
        const x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            const intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }
    // Recalculates quad heights, given a quad and a texture height.
    // Modifies the quad's height, topHeight, and its yOffset.
    // Does nothing to one-sided, upper, or lower quads.
    // Returns the modified quad.
    static recalculateMidtex(quad, height) {
        // Midtexture height must be calculated.
        // The bottom of Midtextures on lower unpegged linedefs are at the
        // floor of the shortest sector,  offsetted by the Y offset
        // If the midtexture is on a lower unpegged linedef, wall.topHeight is
        // treated as the absolute height of the bottom of the wall rather than
        // the absolute height of the top of the wall.
        if ((quad.alignment.type === TextureAlignmentType.Midtexture) ||
            (quad.alignment.type === TextureAlignmentType.BackMidtexture)) {
            const startHeight = ((quad.alignment.flags &
                TextureAlignmentFlags.LowerUnpegged) !== 0 ?
                quad.floorHeight + height :
                quad.ceilingHeight);
            quad.topHeight = startHeight + quad.yOffset;
            quad.height = height;
            // Difference between quad top height and ceiling height
            const ceilingDifference = quad.ceilingHeight - quad.topHeight;
            if (ceilingDifference < 0) {
                // Quad top is above the ceiling
                quad.height += ceilingDifference;
                quad.topHeight = quad.ceilingHeight;
                // Y offset will be positive, ceilingDifference is negative
                quad.yOffset = -ceilingDifference;
            }
            else {
                // No need to apply Y offset
                quad.yOffset = 0;
            }
            // Difference between floor height and quad bottom height
            const floorDifference = quad.floorHeight - (quad.topHeight - quad.height);
            if (floorDifference > 0) {
                // Quad bottom is beneath the floor
                quad.height -= floorDifference;
            }
            // Just in case quad is completely below the floor
            if (quad.height < 0) {
                quad.height = 0;
            }
        }
        return quad;
    }
    // Get UV coordinates for a quad
    static getQuadUVs(texture, // UV coordinates depend on texture size
    vertexIndex, // Index of vertex in quad
    quad // The data representing the quad
    ) {
        // Separate quad.alignment into type and flags
        const alignType = quad.alignment.type;
        const alignFlags = quad.alignment.flags;
        // For the following 2 arrays:
        // 0 = Upper left
        // 1 = Upper right
        // 2 = Lower left
        // 3 = Lower right
        const uvFactorX = [0, 1, 0, 1];
        const uvFactorY = [0, 0, 1, 1];
        if (texture == null) {
            return [uvFactorX[vertexIndex], uvFactorY[vertexIndex]];
        }
        const xScale = (texture.xScale || 1) * (quad.xScale || 1);
        const yScale = (texture.yScale || 1) * (quad.yScale || 1);
        const texelX = 1 / texture.width;
        const texelY = 1 / texture.height;
        let uvX = texelX * quad.width * xScale;
        let uvY = texelY * uvFactorY[vertexIndex] * quad.height * yScale;
        if (alignType === TextureAlignmentType.BackMidtexture) {
            uvX *= 1 - uvFactorX[vertexIndex];
        }
        else {
            uvX *= uvFactorX[vertexIndex];
        }
        uvX += quad.xOffset * texelX;
        if ((alignType !== TextureAlignmentType.Midtexture) &&
            (alignType !== TextureAlignmentType.BackMidtexture)) {
            // Quad is NOT a midtexture
            if ((alignFlags & TextureAlignmentFlags.LowerUnpegged) !== 0) {
                // Quad is lower unpegged
                if ((alignFlags & TextureAlignmentFlags.TwoSided) === 0) {
                    // One-sided - bottom of texture is at bottom of quad
                    uvY += 1 - texelY * quad.height;
                }
                else {
                    // Two-sided - top of texture is at top of sector
                    // uvY += (quad.sectorHeight - quad.height) * texelY;
                    const sectorHeight = quad.ceilingHeight - quad.floorHeight;
                    uvY += (sectorHeight - quad.height) * texelY;
                }
            }
            else if (alignType === TextureAlignmentType.Upper) {
                uvY += 1 - quad.height * texelY;
            }
        }
        // Apply Y offset regardless.
        // The Y offset for midtextures is modified by recalculateMidtex, since
        // Y offsets for midtextures won't modify the UV coordinates if the
        // midtexture in question is shorter than the sector.
        uvY += quad.yOffset * texelY;
        return [uvX, uvY];
    }
    // Get UV coordinates for a sector vertex
    static getSectorVertexUVs(position, // 2D position of the vertex
    texture) {
        const uvX = position.x / texture.width;
        const uvY = position.y / texture.height;
        return [uvX, uvY];
    }
    // Turn a list of sector lines into a list of vertex indices
    getPolygonsFromLines(sectorLines, sector) {
        const sectorPolygonBuilder = new SectorPolygonBuilder(sectorLines, this.vertices);
        let sectorPolygons = [];
        try {
            sectorPolygons = sectorPolygonBuilder.getPolygons();
        }
        catch (error) {
            console.error(`Failed to build polygons for sector ${sector}!`, error);
            return [];
        }
        return sectorPolygons;
    }
    // Get quads for a particular line
    getQuadsForLine(line) {
        // Ensure line has a valid front sidedef
        if (line.frontSidedef === 0xffff) {
            return [];
        }
        // All lines are made of 1-3 quads - A top quad, and/or bottom quad,
        // and an optional middle quad for two-sided lines, and a middle quad
        // for one-sided lines.
        const front = this.map.sides.getSide(line.frontSidedef);
        const frontSector = this.map.sectors.getSector(front.sector);
        const frontLight = frontSector.light;
        let back = null;
        // Calculate line length - the "width" of quad(s) for the line.
        const lineLength = (() => {
            const lineX = this.vertices[line.endVertex].x - this.vertices[line.startVertex].x;
            const lineY = this.vertices[line.endVertex].y - this.vertices[line.startVertex].y;
            return Math.sqrt(lineX * lineX + lineY * lineY);
        })();
        const frontHeight = frontSector.ceilingHeight - frontSector.floorHeight;
        if (!line.twoSidedFlag || line.backSidedef === 0xffff) {
            // This line has no back side. Some maps have linedefs marked as
            // two-sided, but without a back sidedef.
            // The line is the same height as the sector.
            const alignment = {
                type: TextureAlignmentType.Normal,
                flags: line.lowerUnpeggedFlag ?
                    TextureAlignmentFlags.LowerUnpegged :
                    TextureAlignmentFlags.Normal,
            };
            return [{
                    width: lineLength,
                    height: frontHeight,
                    xOffset: front.x,
                    yOffset: front.y,
                    texture: front.middle,
                    textureSet: textureLibrary_1.TextureSet.Walls,
                    startX: this.vertices[line.startVertex].x,
                    startY: -this.vertices[line.startVertex].y,
                    endX: this.vertices[line.endVertex].x,
                    endY: -this.vertices[line.endVertex].y,
                    topHeight: frontSector.ceilingHeight,
                    ceilingHeight: frontSector.ceilingHeight,
                    floorHeight: frontSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: frontLight,
                    reverse: false,
                    place: LineQuadPlace.Middle,
                }];
        }
        else {
            // This line is a two-sided line. In other words, it has a sector
            // on both sides.
            // A 2-sided line may have up to 3 quads - top, middle, and bottom.
            const lineQuads = [];
            // It is known that the side will not be null because the sidedef
            // index is not 0xffff
            back = this.map.sides.getSide(line.backSidedef);
            const backSector = this.map.sectors.getSector(back.sector);
            const backHeight = backSector.ceilingHeight - backSector.floorHeight;
            const backLight = backSector.light;
            const heights = getSideHeights(frontSector, backSector);
            if (heights.middleTop - heights.middleBottom > 0) {
                if (front.middle !== "-") {
                    // Front side midtex
                    let midQuadTop = line.lowerUnpeggedFlag ?
                        heights.middleBottom : heights.middleTop;
                    midQuadTop += front.y;
                    const alignment = {
                        type: TextureAlignmentType.Midtexture,
                        flags: line.lowerUnpeggedFlag ? TextureAlignmentFlags.LowerUnpegged : 0,
                    };
                    lineQuads.push({
                        width: lineLength,
                        height: -1,
                        xOffset: front.x,
                        yOffset: front.y,
                        texture: front.middle,
                        textureSet: textureLibrary_1.TextureSet.Walls,
                        startX: this.vertices[line.startVertex].x,
                        startY: -this.vertices[line.startVertex].y,
                        endX: this.vertices[line.endVertex].x,
                        endY: -this.vertices[line.endVertex].y,
                        topHeight: midQuadTop,
                        ceilingHeight: heights.middleTop,
                        floorHeight: heights.middleBottom,
                        alignment,
                        worldPanning: true,
                        lightLevel: frontLight,
                        reverse: false,
                        place: LineQuadPlace.Midtexture,
                    });
                }
                if (back.middle !== "-") {
                    // Back side midtex
                    let midQuadTop = line.lowerUnpeggedFlag ?
                        heights.middleBottom : heights.middleTop;
                    midQuadTop += back.y;
                    const alignment = {
                        type: TextureAlignmentType.BackMidtexture,
                        flags: line.lowerUnpeggedFlag ? TextureAlignmentFlags.LowerUnpegged : 0,
                    };
                    lineQuads.push({
                        width: lineLength,
                        height: -1,
                        xOffset: back.x,
                        yOffset: back.y,
                        texture: back.middle,
                        textureSet: textureLibrary_1.TextureSet.Walls,
                        startX: this.vertices[line.startVertex].x,
                        startY: -this.vertices[line.startVertex].y,
                        endX: this.vertices[line.endVertex].x,
                        endY: -this.vertices[line.endVertex].y,
                        topHeight: midQuadTop,
                        ceilingHeight: heights.middleTop,
                        floorHeight: heights.middleBottom,
                        alignment,
                        worldPanning: true,
                        lightLevel: backLight,
                        reverse: true,
                        place: LineQuadPlace.Midtexture,
                    });
                }
            }
            if (heights.front.upperTop > heights.front.upperBottom) {
                // Upper quad on front side
                const alignment = {
                    // Normal alignment is equivalent to upper unpegged
                    type: line.upperUnpeggedFlag ?
                        TextureAlignmentType.Normal :
                        TextureAlignmentType.Upper,
                    flags: 0,
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.front.upperTop - heights.front.upperBottom,
                    xOffset: front.x,
                    yOffset: front.y,
                    texture: front.upper,
                    textureSet: textureLibrary_1.TextureSet.Walls,
                    startX: this.vertices[line.startVertex].x,
                    startY: -this.vertices[line.startVertex].y,
                    endX: this.vertices[line.endVertex].x,
                    endY: -this.vertices[line.endVertex].y,
                    topHeight: heights.front.upperTop,
                    ceilingHeight: frontSector.ceilingHeight,
                    floorHeight: frontSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: frontLight,
                    reverse: false,
                    place: LineQuadPlace.Upper,
                });
            }
            if (heights.front.lowerTop > heights.front.lowerBottom) {
                // Lower quad on front side
                const alignment = {
                    type: TextureAlignmentType.Normal,
                    flags: TextureAlignmentFlags.TwoSided |
                        (line.lowerUnpeggedFlag ?
                            TextureAlignmentFlags.LowerUnpegged : 0),
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.front.lowerTop - heights.front.lowerBottom,
                    xOffset: front.x,
                    yOffset: front.y,
                    texture: front.lower,
                    textureSet: textureLibrary_1.TextureSet.Walls,
                    startX: this.vertices[line.startVertex].x,
                    startY: -this.vertices[line.startVertex].y,
                    endX: this.vertices[line.endVertex].x,
                    endY: -this.vertices[line.endVertex].y,
                    topHeight: heights.front.lowerTop,
                    ceilingHeight: frontSector.ceilingHeight,
                    floorHeight: frontSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: frontLight,
                    reverse: false,
                    place: LineQuadPlace.Lower,
                });
            }
            if (heights.back.upperTop > heights.back.upperBottom) {
                // Upper quad on back side
                const alignment = {
                    type: line.upperUnpeggedFlag ?
                        TextureAlignmentType.Normal :
                        TextureAlignmentType.Upper,
                    flags: 0,
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.back.upperTop - heights.back.upperBottom,
                    xOffset: back.x,
                    yOffset: back.y,
                    texture: back.upper,
                    textureSet: textureLibrary_1.TextureSet.Walls,
                    startX: this.vertices[line.endVertex].x,
                    startY: -this.vertices[line.endVertex].y,
                    endX: this.vertices[line.startVertex].x,
                    endY: -this.vertices[line.startVertex].y,
                    topHeight: heights.back.upperTop,
                    ceilingHeight: backSector.ceilingHeight,
                    floorHeight: backSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: backLight,
                    reverse: false,
                    place: LineQuadPlace.Upper,
                });
            }
            if (heights.back.lowerTop > heights.back.lowerBottom) {
                // Lower quad on back side
                const alignment = {
                    type: TextureAlignmentType.Normal,
                    flags: TextureAlignmentFlags.TwoSided |
                        (line.lowerUnpeggedFlag ?
                            TextureAlignmentFlags.LowerUnpegged : 0),
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.back.lowerTop - heights.back.lowerBottom,
                    xOffset: back.x,
                    yOffset: back.y,
                    texture: back.lower,
                    textureSet: textureLibrary_1.TextureSet.Walls,
                    startX: this.vertices[line.endVertex].x,
                    startY: -this.vertices[line.endVertex].y,
                    endX: this.vertices[line.startVertex].x,
                    endY: -this.vertices[line.startVertex].y,
                    topHeight: heights.back.lowerTop,
                    ceilingHeight: backSector.ceilingHeight,
                    floorHeight: backSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: backLight,
                    reverse: false,
                    place: LineQuadPlace.Lower,
                });
            }
            return lineQuads;
        }
        return [];
    }
    // Create all of the sector triangles for the map
    getSectorTriangles(sector, lines) {
        // if(hasGlNodes){  // GL nodes contain data useful for triangulating sectors
        // }else{
        // Get sector polygons and triangulate the sector
        const sectorRawPolygons = this.getPolygonsFromLines(lines, sector);
        const sectorPolygons = sectorRawPolygons.map((rawPolygon) => {
            // Convert indices to positions
            const polygonVertices = rawPolygon.map((vertexIndex) => {
                return new THREE.Vector2(this.vertices[vertexIndex].x, -this.vertices[vertexIndex].y);
            });
            return {
                vertices: polygonVertices,
                holes: [],
                boundingBox: BoundingBox.from(polygonVertices),
                isHole: false,
            };
        });
        // Sort by area in descending order.
        // I think this will make it faster to build the sector
        // ceiling/floor triangles.
        sectorPolygons.sort((polyA, polyB) => polyB.boundingBox.area() - polyA.boundingBox.area());
        // Find holes
        sectorPolygons.forEach((polygon, polygonIndex) => {
            // Find out which polygons "contain" this one
            let containerPolygons = sectorPolygons.slice(0, polygonIndex);
            containerPolygons = containerPolygons.filter((otherPolygon) => {
                if (otherPolygon.boundingBox.area() === polygon.boundingBox.area()) {
                    return false;
                }
                const boundBoxComparison = otherPolygon.boundingBox.compare(polygon.boundingBox);
                if (boundBoxComparison === BoundingBoxComparison.Contains) {
                    return polygon.vertices.some((point) => {
                        // Check whether a vertex on the other polygon is the
                        // same as a vertex on this polygon, and if it is, treat
                        // it as a separate polygon rather than a hole. Fixes
                        // Eviternity MAP27
                        const pointOnOtherVertex = otherPolygon.vertices.findIndex((otherPoint) => point.equals(otherPoint));
                        if (pointOnOtherVertex === -1) {
                            // This vertex is not the same as a vertex on the
                            // other polygon, so it may be a hole.
                            return MapGeometryBuilder.pointInPolygon(point, otherPolygon.vertices);
                        }
                        else {
                            // This vertex is the same as a vertex on the other
                            // polygon, so it's not a hole.
                            return false;
                        }
                    });
                }
                return false;
            });
            // Get the smallest polygon containing this one, and make this
            // polygon a hole if the smallest polygon containing this one is not.
            const smallestContainerPolygon = (containerPolygons[containerPolygons.length - 1]);
            if (smallestContainerPolygon && !smallestContainerPolygon.isHole) {
                smallestContainerPolygon.holes.push(polygon.vertices);
                polygon.isHole = true;
            }
        });
        const mapSector = this.map.sectors.getSector(sector);
        const sectorTriangles = [];
        sectorPolygons.forEach((poly) => {
            if (poly.isHole) {
                return;
            }
            // triangulateShape expects data structures like this:
            // (contour) [{x: 10, y: 10}, {x: -10, y: 10}, {x: -10, y: -10}, {x: 10, y: -10}]
            // (holes) [[{x: 5, y: 5}, {x: -5, y: 5}, {x: -5, y: -5}, {x: 5, y: -5}], etc.]
            const triangles = THREE.ShapeUtils.triangulateShape(poly.vertices, poly.holes);
            const polyVertices = poly.vertices.slice();
            poly.holes.forEach((holeVertices) => {
                Array.prototype.push.apply(polyVertices, holeVertices);
            });
            triangles.forEach((triangle) => {
                const triangleVertices = (triangle.map((vertexIndex) => polyVertices[vertexIndex]));
                sectorTriangles.push({
                    lightLevel: mapSector.light,
                    vertices: triangleVertices,
                    height: mapSector.floorHeight,
                    texture: mapSector.floorFlat,
                    textureSet: textureLibrary_1.TextureSet.Flats,
                    normalVector: new THREE.Vector3(0, 1, 0),
                    reverse: true,
                    place: SectorTrianglePlace.Floor,
                }, {
                    lightLevel: mapSector.light,
                    vertices: triangleVertices,
                    height: mapSector.ceilingHeight,
                    texture: mapSector.ceilingFlat,
                    textureSet: textureLibrary_1.TextureSet.Flats,
                    normalVector: new THREE.Vector3(0, -1, 0),
                    reverse: false,
                    place: SectorTrianglePlace.Ceiling,
                });
            });
        });
        return sectorTriangles;
    }
    // Build the 3D mesh for the map
    rebuild() {
        // The map is missing one of the necessary data lumps
        if (!this.map.sides || !this.map.sectors || !this.map.lines || !this.map.vertexes) {
            throw new TypeError("Some map data is missing!");
        }
        // If the map has GL nodes, use them instead of trying to triangulate the sector manually.
        const hasGlNodes = false;
        // Map of sector indices to lines that form that sector
        const sectorLines = {};
        // Vertices
        this.vertices = Array.from(this.map.enumerateVertexes());
        // Array of quads - used for rendering walls
        const wallQuads = [];
        // Construct all of the quads for the lines on this map
        for (const line of this.map.enumerateLines()) {
            // Add quads for this line to quads array
            Array.prototype.push.apply(wallQuads, this.getQuadsForLine(line));
            // Add line to lists of lines per sector
            if (line.frontSidedef !== 0xffff) { // 0xffff means no sidedef.
                const front = this.map.sides.getSide(line.frontSidedef);
                if (!line.twoSidedFlag || line.backSidedef === 0xffff) {
                    // Ancient aliens MAP24 has some one-sided sidedefs marked
                    // as two-sided. There may be other maps that suffer from
                    // this issue as well.
                    if (sectorLines[front.sector] == null) {
                        sectorLines[front.sector] = [];
                    }
                    sectorLines[front.sector].push(line);
                }
                else {
                    if (line.backSidedef !== 0xffff) {
                        const back = this.map.sides.getSide(line.backSidedef);
                        // Line is two-sided
                        if (front.sector !== back.sector) {
                            if (sectorLines[front.sector] == null) {
                                sectorLines[front.sector] = [];
                            }
                            if (sectorLines[back.sector] == null) {
                                sectorLines[back.sector] = [];
                            }
                            sectorLines[front.sector].push(line);
                            sectorLines[back.sector].push(line);
                        }
                    }
                }
            }
        }
        // Sector triangles - used for rendering sectors
        const sectorTriangles = [];
        for (const sector in sectorLines) {
            // Number.parseInt is required because object keys are strings
            const sectorNumber = Number.parseInt(sector, 10);
            for (const triangle of this.getSectorTriangles(sectorNumber, sectorLines[sector])) {
                sectorTriangles.push(triangle);
            }
        }
        return {
            wallQuads,
            sectorTriangles,
        };
    }
}
exports.MapGeometryBuilder = MapGeometryBuilder;
//# sourceMappingURL=3DMapBuilder.js.map