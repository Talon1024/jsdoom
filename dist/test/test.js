"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const writeIdentical_1 = require("./writeIdentical");
async function runTests() {
    await writeIdentical_1.testWriteIdentical("./test-wads", "doom1.wad");
}
runTests().then(() => {
    console.log("Tests PASSED.");
    process.exit(0);
}).catch((error) => {
    console.log("Tests FAILED.");
    console.log(error);
    process.exit(1);
});
//# sourceMappingURL=test.js.map