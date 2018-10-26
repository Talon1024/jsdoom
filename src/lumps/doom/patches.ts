import {WADLump} from "@src/wad/lump";

// TODO: Use a utility function for reading padded strings instead of
// having to instantiate an object like this
import {WADReader} from "@src/wad/reader";

// Represents the patch table ("PNAMES") lump.
// Stores the names of all patch lumps in the WAD and its dependencies.
// Normally, a graphic must be represented in PNAMES to be usable in
// TEXTURE1 and TEXTURE2 lumps.
export class WADPatches {
    // Patch table lumps are always named "PNAMES".
    static readonly LumpName: string = "PNAMES";
    
    // The binary data representing this patch table.
    data: Buffer;
    
    constructor(data: Buffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a patch table.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.name.toUpperCase() === WADPatches.LumpName && !!(
            lump.length >= 4 && (lump.length % 8 === 4)
        );
    }
    
    // Create a WADPatches given a WADLump object.
    static from(lump: WADLump): WADPatches {
        if(!this.match(lump)){
            throw new Error("Not a valid PNAMES lump.");
        }
        return new WADPatches(<Buffer> lump.data);
    }
    
    // Get the number of patches in the table.
    get length(): number {
        return Math.min(
            Math.floor(this.data.length / 8),
            this.data.readUInt32LE(0)
        );
    }
    
    // Get the patch name at an index.
    // Patch names are up to 8 ASCII characters long and should match the
    // names of lumps in this WAD or another loaded WAD.
    getPatchName(patchIndex: number): string {
        if(patchIndex < 0 || patchIndex >= this.length){
            throw new Error("Patch index out of range.");
        }
        const reader: WADReader = new WADReader(this.data);
        return reader.padded(4 + (8 * patchIndex), 8);
    }
    
    // Enumerate all of the patch names in the lump.
    *enumeratePatchNames(): Iterable<string> {
        const reader: WADReader = new WADReader(this.data);
        const numPatches: number = this.length;
        for(let patchIndex: number = 0; patchIndex < numPatches; patchIndex++){
            yield reader.padded(4 + (8 * patchIndex), 8);
        }
    }
}

export default WADPatches;
