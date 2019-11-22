"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Get an element by ID.
function id(id) {
    return document.getElementById(id);
}
exports.id = id;
// Get elements by class name.
function cls(element, className) {
    if (!element) {
        return [];
    }
    else {
        return element.getElementsByClassName(className);
    }
}
exports.cls = cls;
// Get the first element with a class name.
function fcls(element, className) {
    if (!element) {
        return null;
    }
    const elements = element.getElementsByClassName(className);
    if (elements.length) {
        return elements[0];
    }
    else {
        return null;
    }
}
exports.fcls = fcls;
// Remove all children from an element.
function removeChildren(element) {
    while (element && element.lastChild) {
        element.removeChild(element.lastChild);
    }
}
exports.removeChildren = removeChildren;
function styleElement(element, style) {
    if (element && style) {
        for (const key in style) {
            element.style[key] = style[key];
        }
    }
}
exports.styleElement = styleElement;
function createElement(options) {
    const element = document.createElement(options.tag || "div");
    const indirectProperties = {
        tag: () => { },
        appendTo: (options) => {
            if (options.appendTo) {
                options.appendTo.appendChild(element);
            }
        },
        class: (options) => {
            element.classList.add(options.class);
        },
        classList: (options) => {
            if (options.classList) {
                for (const cls of options.classList) {
                    element.classList.add(cls);
                }
            }
        },
        content: (options) => {
            if (options.content instanceof Element) {
                element.appendChild(options.content);
            }
            else if (Array.isArray(options.content)) {
                options.content.forEach((e) => element.appendChild(e));
            }
            else if (!("innerText" in options)) {
                element.innerText = String(options.content);
            }
        },
        style: (options) => {
            styleElement(element, options.style);
        },
        children: (options) => {
            if (options.children) {
                for (const child of options.children) {
                    if (!child) {
                        // pass
                    }
                    else if (child instanceof Element) {
                        element.appendChild(child);
                    }
                    else {
                        element.appendChild(createElement(child));
                    }
                }
            }
        },
        onleftclick: (options) => {
            element.onclick = function (event) {
                if (event.button === 0 && !event.ctrlKey) {
                    options.onleftclick.call(this, event);
                }
            };
        },
        onleftmousedown: (options) => {
            element.onmousedown = function (event) {
                if (event.button === 0 && !event.ctrlKey) {
                    options.onleftmousedown.call(this, event);
                }
            };
        },
        listener: (options) => {
            if (typeof (options.listener) !== "object") {
                return;
            }
            for (const key in options.listener) {
                element.addEventListener(key, options.listener[key]);
            }
        },
    };
    for (const key in options) {
        if (options[key] !== undefined) {
            if (indirectProperties[key]) {
                indirectProperties[key](options);
            }
            else {
                element[key] = options[key];
            }
        }
    }
    return element;
}
exports.createElement = createElement;
//# sourceMappingURL=util.js.map