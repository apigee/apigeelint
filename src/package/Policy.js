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

function getAttributeValue(attributes, name) {
    name = name.toUpperCase();
    for (var key in attributes) {
        if (attributes[key].name.toUpperCase() === name) {
            return attributes[key].value;
        }
    }
}

Policy.prototype.getName = function() {
    if (!this.name) {
        var doc = xpath.select("/", new Dom().parseFromString(this.getContent()));
        this.type = doc[0].documentElement.tagName;
        this.name = getAttributeValue(doc[0].documentElement.attributes, "name");
    }
    return this.name;
};

Policy.prototype.select = function(xs) {    
        return xpath.select(xs, new Dom().parseFromString(this.getContent()));
};

Policy.prototype.getContent = function() {
    //read the contents of the file and return it raw
    if (!this.content) {
        this.content = fs.readFileSync(this.filePath).toString();
    }
    return this.content;
};

Policy.prototype.getFileName = function() {
    return this.fileName;
};

Policy.prototype.getType = function() {
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

//Public
module.exports = Policy;
