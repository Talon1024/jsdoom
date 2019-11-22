"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Items in argv that do not appear to belong to any recognized option
// are added to the default "_" option.
exports.DefaultOption = {
    name: "_",
    help: "Capture options not matching any listed.",
    type: (i) => { return i; },
    list: true,
};
// Get a string including help text for each accepted option.
function getHelp(options) {
    const lines = [];
    for (const option of options) {
        if (option.help) {
            lines.push(`-${option.name} : ${option.help}`);
        }
        else {
            lines.push(`-${option.name}`);
        }
    }
    return lines.join("\n");
}
exports.getHelp = getHelp;
// Parse the strings in argv (or in another array passed in as an argument)
// and output an object mapping option names to the values found for each.
function parse(options, argv) {
    const list = argv || process.argv.slice(2);
    const args = {};
    let currentOption = exports.DefaultOption;
    // Populate default values
    for (const option of options) {
        if (option.default !== undefined) {
            args[option.name] = option.type(option.default);
        }
        else if (option.list) {
            args[option.name] = [];
        }
        else if (option.flag) {
            args[option.name] = false;
        }
    }
    // Parse the arguments
    for (const item of list) {
        let isOption = false;
        for (const option of options) {
            if (item === "-" + option.name || item === "--" + option.name) {
                isOption = true;
                if (option.flag) {
                    args[option.name] = option.type(true);
                }
                else {
                    currentOption = option;
                }
            }
        }
        if (!isOption) {
            const value = currentOption.type(item);
            if (currentOption.list) {
                if (args[currentOption.name]) {
                    args[currentOption.name].push(value);
                }
                else {
                    args[currentOption.name] = [value];
                }
            }
            else {
                args[currentOption.name] = value;
                currentOption = exports.DefaultOption;
            }
        }
    }
    // All done
    return args;
}
exports.parse = parse;
// Convenience class for clean handling of CLI option parsing.
class Parser {
    constructor(options) {
        this.options = options;
    }
    getHelp() {
        return getHelp(this.options);
    }
    showHelp(header) {
        console.log(`\n${header}\n\n${this.getHelp()}\n`);
    }
    parse(argv) {
        return parse(this.options, argv);
    }
}
exports.Parser = Parser;
exports.default = Parser;
//# sourceMappingURL=options.js.map