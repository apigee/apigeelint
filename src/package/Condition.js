//Condition.js

//Private
var fs = require("fs"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser,
    myUtil = require("./myUtil.js");

function Condition(element, parent) {
    this.parent = parent;
    this.element = element;
}

Condition.prototype.getExpression = function() {
    return this.element.childNodes[0].nodeValue || "";
};

Condition.prototype.getElement = function() {
    return this.element;
};

Condition.prototype.getParent = function() {
    return this.parent;
};

Condition.prototype.warn = function(msg) {
    this.parent.warn(msg);
};

Condition.prototype.err = function(msg) {
    this.parent.err(msg);
};

Condition.prototype.checkConditions = function(pluginFunction) {
    pluginFunction(this);
}

Condition.prototype.summarize = function() {
    var summary = {};
    summary.condition = this.getExpression();
    return summary;
};


//Public
module.exports = Condition;
