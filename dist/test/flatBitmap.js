"use strict";
// This is a MANUAL test.
// Run this program with these arguments:
Object.defineProperty(exports, "__esModule", { value: true });
/*
export async function flatBitmapTest(
    wad: WADFile, flatName: string
): Promise<any> {
    const colors: WADColors = WADColors.getFromWads([wad]);
    const flatLump: (WADLump | null) = wad.firstByName(flatName);
    if(!flatLump){
        throw new Error(`No lump named "${flatName}".`);
    }
    const flat: WADFlat = WADFlat.from(flatLump);
    
    console.log(`Writing "${flatName}.BMP"...`);
    const bmp = getFlatBitmap({
        flat: flat,
        playpal: colors.playpal,
        colormap: colors.colormap,
    });
    fs.writeFileSync(flatName + ".BMP", bmp);
    console.log("Finished writing bitmap.");
    
    console.log(`Writing "${flatName}.PNG"...`);
    const flatPixelData = flat.getPixelDataRGBA(colors);
    const png = UPNG.encode([flatPixelData.buffer], 64, 64, 256);
    fs.writeFileSync(flatName + ".PNG", Buffer.from(png));
    console.log("Finished writing PNG.");
    
    const picName: string = "PLAYD2D8"; //"TITLEPIC";
    const picLump: (WADLump | null) = wad.firstByName(picName);
    if(!picLump){
        throw new Error(`No lump named "${picName}".`);
    }
    const pic: WADPicture = WADPicture.from(picLump);
    console.log(`Writing "${picName}.PNG"...`);
    console.log(`Dimensions: ${pic.width} x ${pic.height}`);
    const picPixelData = pic.getPixelDataRGBA(colors);
    console.log("pixelData:", picPixelData);
    console.log("pixelData.buffer:", picPixelData.buffer);
    const picPng = UPNG.encode([picPixelData.buffer], pic.width, pic.height, 0);
    fs.writeFileSync(picName + ".PNG", Buffer.from(picPng));
    console.log("Finished writing PNG.");
}
*/
//# sourceMappingURL=flatBitmap.js.map