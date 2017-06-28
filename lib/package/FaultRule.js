//FaultRule.js

//Private
var Condition = require("./Condition.js"),
  xpath = require("xpath");

function FaultRule(element, parent) {
  this.parent = parent;
  this.element = element;
}

FaultRule.prototype.getName = function() {
  if (!this.name) {
    var attr = xpath.select("./@name", this.element);
    this.name = (attr[0] && attr[0].value) || "";
  }
  return this.name;
};

FaultRule.prototype.getType = function() {
  return this.element.tagName;
};

FaultRule.prototype.getSteps = function() {
  if (!this.steps) {
    var doc = xpath.select("./Step", this.element),
      fr = this,
      Step = require("./Step.js");
    fr.steps = [];
    if (doc) {
      doc.forEach(function(stElement) {
        fr.steps.push(new Step(stElement, fr));
      });
    }
  }
  return this.steps;
};

FaultRule.prototype.getCondition = function() {
  if (!this.condition) {
    var doc = xpath.select("./Condition", this.element);
    this.condition = doc && doc[0] && new Condition(doc[0], this);
  }
  return this.condition;
};

FaultRule.prototype.getElement = function() {
  return this.element;
};

FaultRule.prototype.getParent = function() {
  return this.parent;
};

FaultRule.prototype.warn = function(msg) {
  this.parent.warn(msg);
};

FaultRule.prototype.err = function(msg) {
  this.parent.err(msg);
};

FaultRule.prototype.onConditions = function(pluginFunction) {
  if (this.getCondition()) {
    pluginFunction(this.getCondition());
  }
  //look at the steps inside
  this.getSteps() &&
    this.getSteps().forEach(function(step) {
      step.onConditions(pluginFunction);
    });
};

FaultRule.prototype.onSteps = function(pluginFunction) {
  this.getSteps() &&
    this.getSteps().forEach(function(step) {
      step.onSteps(pluginFunction);
    });
};

FaultRule.prototype.summarize = function() {
  var summary = {};
  summary.name = this.getName();
  var theSteps = this.getSteps();
  summary.steps = [];
  theSteps.forEach(function(step) {
    summary.steps.push(step.summarize());
  });
  summary.condition =
    (this.getCondition() && this.getCondition().summarize()) || {};
  return summary;
};

//Public
module.exports = FaultRule;
