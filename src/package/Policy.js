//Policy.js

//Private
var fs = require("fs"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser;

function Policy(path, fn) {
    this.fileName = fn;
    this.filePath = path + "/" + fn;
    this.messages = { warnings: [], errors: [] };
}

Policy.prototype.getName = function() {
    if (!this.name) {
        var attr = xpath.select("//@name", this.getElement());
        this.name = attr[0] && attr[0].value || "";
    }
    return this.name;
};

Policy.prototype.getDisplayName = function() {
    if (!this.displayName) {
        var doc = xpath.select("//DisplayName", this.getElement());
        this.displayName = doc[0].childNodes[0].nodeValue;
    }
    return this.displayName;
};

Policy.prototype.select = function(xs) {
    return xpath.select(xs, this.getElement());
};

Policy.prototype.getElement = function() {
    //read the contents of the file and return it raw
    if (!this.element) {
        this.element = new Dom().parseFromString(fs.readFileSync(this.filePath).toString());
    }
    return this.element;
};

Policy.prototype.getFileName = function() {
    return this.fileName;
};

Policy.prototype.getType = function() {
    if (!this.type) {
        var doc = xpath.select("/", this.getElement());
        this.type = doc && doc[0] && doc[0].documentElement.tagName || "";
    }
    return this.type;
};

Policy.prototype.warn = function(msg) {
    return this.messages.warnings.push(msg);
};

Policy.prototype.err = function(msg) {
    return this.messages.errors.push(msg);
};

Policy.prototype.getMessages = function() {
    return this.messages;
};

Policy.prototype.getSteps = function() {
    return this.steps;
};

//Public
module.exports = Policy;
