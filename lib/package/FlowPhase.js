/*
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const xpath = require("xpath"),
      Step = require("./Step.js"),
      myUtil = require("./myUtil.js"),
      debug = require("debug")("apigeelint:FlowPhase"),
      getcb = myUtil.curry(myUtil.diagcb, debug);

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
    let doc = xpath.select("./Step", this.element),
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
  let steps = this.getSteps();
  if (steps && steps.length > 0) {
    steps.forEach( (step, ix) =>
        pluginFunction(step, getcb(`step ${ix}}`)));
  }
  cb(null, {});
};

FlowPhase.prototype.onConditions = function(pluginFunction, cb) {
  let steps = this.getSteps();
  if (steps && steps.length > 0) {
    steps.forEach( (step, ix) =>
        step.onConditions(pluginFunction, getcb(`step ${ix}}`)));
  }
  cb(null, {});
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
