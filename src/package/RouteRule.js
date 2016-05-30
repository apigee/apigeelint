//RouteRule.js

//Private
var fs = require("fs"),
    Condition = require("./Condition.js"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser,
    myUtil = require("./myUtil.js");

function RouteRule(element, parent) {
    this.parent = parent;
    this.element = element;
}

RouteRule.prototype.getName = function() {
    if (!this.name) {
        var attr = xpath.select("//@name", this.element);
        this.name = attr[0] && attr[0].value || "";
    }
    return this.name;
};

RouteRule.prototype.getType = function() {
    return this.element.tagName;
};

RouteRule.prototype.getTargetEndpoint = function() {
    if (!this.targetEndpoint) {
        //find the preflow tag
        var doc = xpath.select("./TargetEndpoint", this.element);
        if (doc && doc[0]) {
            this.targetEndpoint = doc && doc[0] && doc[0].childNodes[0].nodeValue || "";
        }
    }
    return this.targetEndpoint;
};


RouteRule.prototype.getCondition = function() {
    if (!this.condition) {
        var doc = xpath.select("./Condition", this.element);
        this.condition = doc && doc[0] && new Condition(doc[0], this);
    }
    return this.condition;
};

RouteRule.prototype.getElement = function() {
    return this.element;
};

RouteRule.prototype.getParent = function() {
    return this.parent;
};

RouteRule.prototype.warn = function(msg) {
    this.parent.warn(msg);
};

RouteRule.prototype.err = function(msg) {
    this.parent.err(msg);
};


RouteRule.prototype.checkConditions = function(pluginFunction) {
    if (this.getCondition()) {
        pluginFunction(this.getCondition());
    }
};

RouteRule.prototype.summarize = function() {
    var summary = {};
    summary.name = this.getName();
    summary.targetEndpoint = this.getTargetEndpoint();
    summary.condition = this.getCondition() && this.getCondition().summarize() || {};
    return summary;
};


//Public
module.exports = RouteRule;
