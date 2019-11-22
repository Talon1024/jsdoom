"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class KeyboardListener {
    constructor() {
        this.keyState = {};
        this.keyPressed = (e) => this.keyState[e.key] = true;
        this.keyReleased = (e) => this.keyState[e.key] = false;
        document.addEventListener("keydown", this.keyPressed);
        document.addEventListener("keyup", this.keyReleased);
    }
    dispose() {
        document.removeEventListener("keydown", this.keyPressed);
        document.removeEventListener("keyup", this.keyReleased);
    }
}
exports.KeyboardListener = KeyboardListener;
//# sourceMappingURL=keyboardListener.js.map