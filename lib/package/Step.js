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

const Condition = require("./Condition.js"),
      FaultRule = require("./FaultRule.js"),
      xpath = require("xpath"),
      myUtil = require("./myUtil.js"),
      debug = require("debug")("apigeelint:Bundle"),
      getcb = myUtil.curry(myUtil.diagcb, debug);

function Step(element, parent) {
  this.parent = parent;
  this.element = element;
}

Step.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

Step.prototype.getMessages = function() {
  return this.parent.getMessages();
};

Step.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop =
        (this.element.nextSibling && this.element.nextSibling.lineNumber - 1) ||
        this.element.lastChild.lineNumber;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

Step.prototype.getName = function() {
  if (!this.name) {
    var doc = xpath.select("./Name", this.element);
    this.name =
      (doc &&
        doc[0] &&
        doc[0].childNodes[0] &&
        doc[0].childNodes[0].nodeValue) ||
      "";
  }
  return this.name;
};

Step.prototype.getType = function() {
  if (!this.type) {
    this.type = xpath.select("name(/*)", this.element);
  }
  return this.type;
};

Step.prototype.getFlowName = function() {
  if (!this.flowName) {
    this.flowName =
      myUtil.getFileName(this) +
      ":" +
      myUtil.buildTagBreadCrumb(this.element) +
      this.getName();
  }
  return this.flowName;
};

Step.prototype.getFaultRules = function() {
  if (!this.faultRules) {
    var doc = xpath.select("./FaultRules/FaultRule", this.element),
      st = this;
    st.faultRules = [];
    if (doc) {
      doc.forEach(function(frElement) {
        //flows get a flow from here
        st.faultRules.push(new FaultRule(frElement, st));
      });
    }
  }
  return this.faultRules;
};

Step.prototype.getCondition = function() {
  if (!this.condition) {
    var element = xpath.select("./Condition", this.element);
    this.condition = element && element[0] && new Condition(element[0], this);
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

Step.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

Step.prototype.onConditions = function(pluginFunction, callback) {
  let step = this,
      faultRules = step.getFaultRules();
  if (step.getCondition()) {
    pluginFunction(step.getCondition(), getcb(`onConditions ${this.getName()}`));
  }
  if (faultRules && faultRules.length > 0) {
    faultRules.forEach(fr =>
                       fr.onConditions(pluginFunction, getcb(`onConditions FaultRule '${fr.getName()}'`)));
  }
  callback(null, {});
};

Step.prototype.onSteps = function(pluginFunction, callback) {
  let step = this,
      faultRules = step.getFaultRules();
  pluginFunction(step, getcb(`onSteps ${this.getName()}`));

  if (faultRules && faultRules.length > 0) {
    faultRules.forEach(fr =>
              fr.onSteps(pluginFunction, getcb(`onSteps FaultRule '${this.getName()}'`)));
  }
  callback(null, {});

};

Step.prototype.summarize = function() {
  return {
    name : this.getName(),
    flowName : this.getFlowName(),
    condition : (this.getCondition() && this.getCondition().summarize()) || {},
    faultRules : this.getFaultRules() && this.faultRules.map( fr => fr.summarize())
  };
};

//Public
module.exports = Step;
