//Policy.js

//Private
var fs = require("fs"),
    xpath = require('xpath'),
    dom = require('xmldom').DOMParser;

//Public
module.exports = Policy;

function Policy(path, fn) {
    this.fileName = fn;
    this.filePath = path + "/" + fn;
    this.messages = { warnings: [], errors: [] };
}

Policy.prototype.getName = function() {
    if (!this.name) {
        var doc = xpath.select("/", new dom().parseFromString(this.getContent()));
        this.type = doc[0].documentElement.tagName;
        this.name = getAttributeValue(doc[0].documentElement.attributes, "name");
    }
    return this.name;
};

Policy.prototype.select = function(xs) {    
        return xpath.select(xs, new dom().parseFromString(this.getContent()));
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
}

function getAttributeValue(attributes, name) {
    name = name.toUpperCase();
    for (key in attributes) {
        if (attributes[key].name.toUpperCase() === name) {
            return attributes[key].value;
        }
    }
}
