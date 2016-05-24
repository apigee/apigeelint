//Step.js

//Private
var fs = require("fs"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser;

function Step(content, fn) {
    this.fileName = fn;
    this.content = content;
    this.messages = { warnings: [], errors: [] };
}

function rBuildTagBreadCrumb(doc, bc) {
    if (doc.parentNode) {
        bc = rBuildTagBreadCrumb(doc.parentNode, doc.parentNode.nodeName + ":" + bc);
    }
    return bc;
}

function buildTagBreadCrumb(doc) {
    return rBuildTagBreadCrumb(doc, "");
}

Step.prototype.getName = function() {
    if (!this.name) {
        var doc = xpath.select("./Name", this.content);
        this.name = doc[0].childNodes[0].nodeValue;
    }
    return this.name;
};

Step.prototype.getFlowName = function() {
    if (!this.flowName) {
        this.flowName = buildTagBreadCrumb(this.content) + this.getName();
    }
    return this.flowName;
};

Step.prototype.getCondition = function() {
    if (!this.condition) {
        var doc = xpath.select("./Condition", this.content);
        if (doc && doc[0]) {
            this.condition = doc[0].childNodes[0].nodeValue;
        } else {
            this.condition = "";
        }
    }
    return this.condition;
};

Step.prototype.select = function(xs) {
    return xpath.select(xs, this.content);
};

Step.prototype.getContent = function() {
    return this.content;
};

Step.prototype.getFileName = function() {
    return this.fileName;
};

Step.prototype.warn = function(msg) {
    return this.messages.warnings.push(msg);
};

Step.prototype.err = function(msg) {
    return this.messages.errors.push(msg);
};

Step.prototype.getMessages = function() {
    return this.messages;
};


//Public
module.exports = Step;
