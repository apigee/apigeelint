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

function buildTagBreadCrumb(doc) {
    return r_buildTagBreadCrumb(doc, "");
}

function r_buildTagBreadCrumb(doc, bc) {
    if (doc.parentNode) {
        bc = r_buildTagBreadCrumb(doc.parentNode, doc.parentNode.nodeName + ":" + bc);
    }
    return bc;
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
        /*if (this.content.parentNode.parentNode.parentNode.attributes && this.content.parentNode.parentNode.parentNode.attributes[0]) {
            this.flowName = this.content.parentNode.parentNode.parentNode.attributes[0].nodeValue;
        } else if (this.content.parentNode.parentNode.parentNode.parentNode && this.content.parentNode.parentNode.parentNode.parentNode.tagName) {
            this.flowName = this.content.parentNode.parentNode.parentNode.parentNode.tagName;
        } else { debugger; }
        this.flowName += ":" + this.content.parentNode.parentNode.parentNode.nodeName + ":" + this.content.parentNode.parentNode.nodeName + ":" + this.content.parentNode.nodeName;
        this.flowName += "-" + this.getName();*/
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
