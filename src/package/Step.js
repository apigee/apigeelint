//Step.js

//Private
var fs = require("fs"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser,
    myUtil = require("./myUtil.js");

function Step(element, parent) {
    this.parent = parent;
    this.element = element;
    this.messages = { warnings: [], errors: [] };
}

Step.prototype.getName = function() {
    if (!this.name) {
        var doc = xpath.select("./Name", this.element);
        this.name = doc && doc[0] && doc[0].childNodes[0] && doc[0].childNodes[0].nodeValue || "";
    }
    return this.name;
};

Step.prototype.getFlowName = function() {
    if (!this.flowName) {
        this.flowName = myUtil.getFileName(this) + ":" + myUtil.buildTagBreadCrumb(this.element) + this.getName();
    }
    return this.flowName;
};

Step.prototype.getCondition = function() {
    if (!this.condition) {
        var doc = xpath.select("./Condition", this.element);
        this.condition = doc && doc[0] && doc[0].childNodes[0] && doc[0].childNodes[0].nodeValue || "";
    }
    return this.condition;
};

Step.prototype.select = function(xs) {
    return xpath.select(xs, this.element);
};

Step.prototype.getElement = function() {
    return this.element;
};

Step.prototype.getParent = function() {
    return this.parent;
};

Step.prototype.warn = function(msg) {
    this.parent.warn(msg);
};

Step.prototype.err = function(msg) {
    this.parent.err(msg);
};

Step.prototype.getMessages = function() {
    return this.messages;
};

Step.prototype.summarize = function() {
    var summary = {
        messages: this.messages,
    }
    summary.name = this.getName();
    summary.flowName = this.getFlowName();
    summary.condition = this.getCondition();
    return summary;
};


//Public
module.exports = Step;
