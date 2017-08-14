//FlowPhase.js

//Private
var xpath = require("xpath"),
  Step = require("./Step.js"),
  async = require("async");

function FlowPhase(element, parent) {
  this.parent = parent;
  this.element = element;
}

FlowPhase.prototype.getType = function() {
  if (!this.type) {
    this.type = "FlowPhase";
    //this.type = this.getPhase();
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
      doc.forEach(function(stepElement) {
        fp.steps.push(new Step(stepElement, fp));
      });
    }
  }
  return this.steps;
};

FlowPhase.prototype.onSteps = function(pluginFunction, cb) {
  //async
  if (this.getSteps()) {
    async.each(
      this.getSteps(),
      function(step, cb) {
        pluginFunction(step, cb);
      },
      function(err) {
        cb(err);
      }
    );
  }
};

FlowPhase.prototype.onConditions = function(pluginFunction, cb) {
  //async
  if (this.getSteps()) {
    async.each(
      this.getSteps(),
      function(step, cb) {
        step.onConditions(pluginFunction, cb);
      },
      function(err) {
        cb(err);
      }
    );
  }
};

FlowPhase.prototype.getElement = function() {
  return this.element;
};

FlowPhase.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

FlowPhase.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop = this.element.nextSibling.lineNumber - 1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

FlowPhase.prototype.getParent = function() {
  return this.parent;
};

FlowPhase.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
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
