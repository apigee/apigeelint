//FlowPhase.js

//Private
var xpath = require("xpath"),
    Step = require("./Step.js"),
    Dom = require("xmldom").DOMParser,
    myUtil = require("./myUtil.js");

function FlowPhase(element, parent) {
    this.parent = parent;
    this.element = element;
}

FlowPhase.prototype.getType = function() {
    if (!this.type) {
        this.type = this.element.parentNode.tagName;
    }
    return this.type;
};

FlowPhase.prototype.getSteps = function() {
    if (!this.steps) {
        var doc = xpath.select("./Step", this.element),
            fp = this;
        fp.steps = [];
        if (doc) {
            doc.forEach(function(stepElement) {
                fp.steps.push(new Step(stepElement, fp));
            });
        }
    }
    return this.steps;
};

FlowPhase.prototype.checkSteps = function(pluginFunction) {
    this.getSteps() && this.getSteps().forEach(pluginFunction);
};

FlowPhase.prototype.checkConditions = function(pluginFunction) {
    this.getSteps() && this.getSteps().forEach(function(st) { st.checkConditions(pluginFunction); });
}

FlowPhase.prototype.getElement = function() {
    return this.element;
};

FlowPhase.prototype.getParent = function() {
    return this.parent;
};

FlowPhase.prototype.warn = function(msg) {
    this.parent.warn(msg);
};

FlowPhase.prototype.err = function(msg) {
    this.parent.err(msg);
};

FlowPhase.prototype.summarize = function() {
    var summary = {};
    summary.steps = [];
    var theSteps = this.getSteps();
    theSteps.forEach(function(step) {
        summary.steps.push(step.summarize());
    });
    return summary;
};


//Public
module.exports = FlowPhase;
