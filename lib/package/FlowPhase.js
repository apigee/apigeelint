//FlowPhase.js

//Private
var xpath = require("xpath"),
    Step = require("./Step.js");

function FlowPhase(element, parent) {
    this.parent = parent;
    this.element = element;
}

FlowPhase.prototype.getType = function () {
    if (!this.type) {
        this.type = this.element.parentNode.tagName;
    }
    return this.type;
};

FlowPhase.prototype.getMessages = function() {
  return this.parent.getMessages();
};

FlowPhase.prototype.getPhase = function() {
    if (!this.phase) {
        this.phase = this.element.tagName;
    }
    return this.phase;
};

FlowPhase.prototype.getSteps = function() {
    if (!this.steps) {
        var doc = xpath.select("./Step", this.element),
            fp = this;
        fp.steps = [];
        if (doc) {
            doc.forEach(function (stepElement) {
                fp.steps.push(new Step(stepElement, fp));
            });
        }
    }
    return this.steps;
};

FlowPhase.prototype.onSteps = function (pluginFunction) {
    this.getSteps() && this.getSteps().forEach(pluginFunction);
};

FlowPhase.prototype.onConditions = function (pluginFunction) {
    this.getSteps() && this.getSteps().forEach(function (st) { st.onConditions(pluginFunction); });
};

FlowPhase.prototype.getElement = function () {
    return this.element;
};

FlowPhase.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

FlowPhase.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber-1,
      stop = this.element.nextSibling.lineNumber-1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

FlowPhase.prototype.getParent = function () {
    return this.parent;
};

FlowPhase.prototype.addMessage = function (msg) {
    this.parent.addMessage(msg);
};

FlowPhase.prototype.summarize = function () {
    var summary = {};
    summary.steps = [];
    var theSteps = this.getSteps();
    theSteps.forEach(function (step) {
        summary.steps.push(step.summarize());
    });
    return summary;
};


//Public
module.exports = FlowPhase;
