"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = require("@src/wad/file");
const lumpType_1 = require("@web/lumpType");
const lumpTypeView_1 = require("@web/lumpTypeView");
const util = require("@web/util");
const win = window;
// TODO: Use a WADFileList
let wad;
let fileInput;
let localFile;
let selectedListItem;
let selectedView = null;
let selectedDefaultView = true;
function getSizeText(bytes, fixed) {
    if (bytes < 1000) {
        return `${bytes}b`;
    }
    else if (fixed) {
        if (bytes < 1000000) {
            return `${(bytes / 1000).toFixed(1)}kb`;
        }
        else {
            return `${(bytes / 1000000).toFixed(1)}mb`;
        }
    }
    else {
        if (bytes < 1000000) {
            return `${(bytes / 1000)}kb`;
        }
        else {
            return `${(bytes / 1000000)}mb`;
        }
    }
}
win.onInspectorLoad = function () {
    fileInput = document.getElementById("main-file-input");
    fileInput.addEventListener("change", function (event) {
        if (!event.target.files[0] || event.target.files[0] === localFile) {
            return;
        }
        localFile = event.target.files[0];
        onLoadNewFile();
    });
};
win.onInspectorDrop = function (event) {
    console.log("Files dropped", event);
    event.preventDefault();
    if (event.dataTransfer.items && event.dataTransfer.items.length) {
        // TODO: Use a WADFileList
        localFile = event.dataTransfer.items[0].getAsFile();
        onLoadNewFile();
    }
    else if (event.dataTransfer.files && event.dataTransfer.files.length) {
        localFile = event.dataTransfer.files[0];
        onLoadNewFile();
    }
};
win.onClickOpenWad = function () {
    fileInput.click();
};
win.loadFromServer = function (file) {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer && messageContainer.hasChildNodes()) {
        for (const childNode of messageContainer.childNodes) {
            messageContainer.removeChild(childNode);
        }
    }
    fetch(file).then((response) => {
        const fileSize = Number.parseInt(response.headers.get("Content-Length") || "0", 10);
        let fileBuffer = new Buffer(0);
        if (response.ok) {
            wad = new file_1.WADFile(file.substring(file.lastIndexOf("/") + 1));
            const progressMessageElement = document.createElement("div");
            progressMessageElement.classList.add("lump-view-info-message");
            const progressMessage = document.createTextNode("%");
            progressMessageElement.appendChild(progressMessage);
            if (messageContainer) {
                messageContainer.appendChild(progressMessageElement);
            }
            let progressBytes = 0;
            const stream = response.body;
            const reader = stream.getReader();
            function readData(result) {
                if (result.done) {
                    return Promise.resolve(fileBuffer);
                }
                progressBytes += result.value.length;
                fileBuffer = Buffer.concat([fileBuffer, Buffer.from(result.value)]);
                if (fileSize > 0) {
                    const progress = Math.floor(progressBytes / fileSize * 100);
                    progressMessage.data = `${progress}%`;
                }
                else {
                    progressMessage.data = "Please wait...";
                }
                return reader.read().then(readData);
            }
            return reader.read().then(readData);
        }
        return Promise.reject(`Attempt to get ${file} failed: ${response.status} ${response.statusText}`);
    }).then((data) => {
        if (messageContainer && messageContainer.hasChildNodes()) {
            for (const childNode of messageContainer.childNodes) {
                messageContainer.removeChild(childNode);
            }
        }
        const buffer = Buffer.from(data);
        wad.loadData(buffer);
        localFile = { name: file.substring(file.lastIndexOf("/") + 1) };
        win.onWadLoaded();
    }).catch((error) => {
        if (messageContainer) {
            const errorMessageElement = document.createElement("div");
            errorMessageElement.classList.add("lump-view-error-message");
            errorMessageElement.appendChild(document.createTextNode(error));
            messageContainer.appendChild(errorMessageElement);
        }
    });
};
function onLoadNewFile() {
    wad = new file_1.WADFile(localFile.name);
    const reader = new FileReader();
    reader.readAsArrayBuffer(localFile);
    reader.onload = function () {
        if (reader.result) {
            wad.loadData(Buffer.from(reader.result));
            win.onWadLoaded();
        }
    };
}
win.onSearchInput = function () {
    const search = util.id("lump-list-search");
    const value = search ? search.value.trim().toUpperCase() : "";
    if (!search || !search.value) {
        filterLumpList((item) => {
            return +item.itemIndex + 1;
        });
    }
    else {
        filterLumpList((item) => {
            const name = item.lump.name.toUpperCase();
            const index = name.indexOf(value);
            return index >= 0 ? index + 1 : 0;
        });
    }
};
function filterLumpList(filter) {
    const listElement = util.id("lump-list-content");
    if (!listElement) {
        return;
    }
    let shownItems = 0;
    for (const item of listElement.children) {
        item.filterValue = filter(item);
        if (!item.filterValue) {
            item.classList.add("filtered");
        }
        else {
            item.classList.remove("filtered");
            shownItems++;
        }
    }
    /*
     * Causes errors
    Array.prototype.sort.call(listElement.children, (a: any, b: any) => {
        return a.filterValue - b.filterValue;
    });
    */
    updateLumpListCount(shownItems, listElement.children.length);
}
function updateLumpListCount(shown, total) {
    const count = util.id("lump-list-count");
    if (count) {
        if (shown < total) {
            count.innerText = `${shown}/${total}`;
        }
        else if (shown) {
            count.innerText = `${shown} Lumps`;
        }
        else {
            count.innerText = "No Lumps";
        }
    }
}
function selectListItem(item) {
    if (item === selectedListItem) {
        return;
    }
    if (selectedListItem) {
        selectedListItem.classList.remove("selected");
    }
    if (item) {
        item.classList.add("selected");
    }
    util.id("lump-view-name").innerText = (item ? item.lump.name : "No Lump");
    if (item.lumpType !== lumpType_1.LumpTypeGeneric) {
        util.id("lump-view-type").innerText = (`${item.lumpType.name} — ${getSizeText(item.lump.length, false)}`);
    }
    else {
        util.id("lump-view-type").innerText = (getSizeText(item.lump.length, false));
    }
    updateLumpViewButtons(item);
    const contentRoot = util.id("lump-view-content");
    if (selectedView && !selectedDefaultView &&
        item.lumpType.getViews(item.lump).indexOf(selectedView) >= 0) {
        viewListItem(item, selectedView);
    }
    else if (!item.lumpType.views.length) {
        const contentRoot = util.id("lump-view-content");
        util.removeChildren(contentRoot);
    }
    else {
        viewListItem(item, item.lumpType.views[0] || lumpTypeView_1.LumpTypeViewHex);
        selectedDefaultView = true;
    }
    selectedListItem = item;
}
function viewListItem(item, view) {
    const contentRoot = util.id("lump-view-content");
    const buttons = util.id("lump-view-buttons");
    if (selectedView && selectedView.clear) {
        selectedView.clear(item.lump, contentRoot);
    }
    util.removeChildren(contentRoot);
    view.view(item.lump, contentRoot);
    selectedView = view;
    for (const child of buttons.children) {
        if (child.view === view) {
            child.classList.add("selected");
        }
        else {
            child.classList.remove("selected");
        }
    }
}
function updateLumpViewButtons(item) {
    const buttons = util.id("lump-view-buttons");
    util.removeChildren(buttons);
    const views = item.lumpType.getViews(item.lump);
    for (const view of views) {
        const button = util.createElement({
            tag: "div",
            class: "view-button",
            view: view,
            appendTo: buttons,
            onleftclick: () => {
                viewListItem(item, view);
                selectedDefaultView = false;
            },
        });
        util.createElement({
            tag: "img",
            class: "icon",
            src: view.icon,
            appendTo: button,
        });
        util.createElement({
            tag: "div",
            class: "name",
            innerText: view.name,
            appendTo: button,
        });
    }
}
win.onWadLoaded = function () {
    updateLumpListCount(wad.lumps.length, wad.lumps.length);
    const listElement = util.id("lump-list-content");
    util.removeChildren(listElement);
    util.id("main-filename").innerText = localFile.name;
    if (!wad) {
        return;
    }
    let itemIndex = 0;
    for (const lump of wad.lumps) {
        const lumpType = lumpType_1.getLumpType(lump);
        const item = util.createElement({
            tag: "div",
            class: "list-item",
            appendTo: listElement,
            lump: lump,
            lumpType: lumpType,
            itemIndex: itemIndex++,
            onleftclick: () => {
                selectListItem(item);
            },
        });
        util.createElement({
            tag: "img",
            class: "icon",
            src: lumpType.icon,
            appendTo: item,
        });
        util.createElement({
            tag: "div",
            class: "name",
            innerText: lump.name,
            appendTo: item,
        });
        util.createElement({
            tag: "div",
            class: "type",
            innerText: lumpType.name,
            appendTo: item,
        });
        util.createElement({
            tag: "div",
            class: "size",
            innerText: getSizeText(lump.length, true),
            appendTo: item,
        });
    }
};
// Support for mobile devices and narrow screens
win.onClickDropdownButton = function (element) {
    element.classList.toggle("dropped");
    util.id("lump-view-buttons").classList.toggle("dropped");
};
//# sourceMappingURL=inspector.js.map