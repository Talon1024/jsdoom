"use strict";
class EventManager {
    constructor(name, target = window) {
        this.eventName = name;
        this.eventTarget = target;
        this.eventHandler = null;
    }
    bind(handler) {
        if (this.eventHandler) {
            this.eventTarget.removeEventListener(this.eventName, this.eventHandler);
        }
        this.eventHandler = handler;
        this.eventTarget.addEventListener(this.eventName, this.eventHandler);
    }
    dispose() {
        this.eventTarget.removeEventListener(this.eventName, this.eventHandler);
    }
}
//# sourceMappingURL=eventManager.js.map