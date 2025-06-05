/*
  Copyright 2019-2020,2024-2025 Google LLC

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
  ConfigElement = require("./ConfigElement.js"),
  xpath = require("xpath"),
  debug = require("debug")("apigeelint:FaultRule"),
  lintUtil = require("./lintUtil.js"),
  getcb = lintUtil.curry(lintUtil.diagcb, debug);

class FaultRule extends ConfigElement {
  constructor(element, parent) {
    super(element, parent);
  }

  getName() {
    if (!this.name) {
      var attr = xpath.select("./@name", this.element);
      this.name = (attr[0] && attr[0].value) || "";
    }
    return this.name;
  }

  getType() {
    return this.element.tagName;
  }

  getSteps() {
    if (!this.steps) {
      var doc = xpath.select("./Step", this.element),
        fr = this,
        Step = require("./Step.js");
      fr.steps = [];
      if (doc) {
        doc.forEach(function (stElement) {
          fr.steps.push(new Step(stElement, fr));
        });
      }
    }
    return this.steps;
  }

  getCondition() {
    if (!this.condition) {
      var doc = xpath.select("./Condition", this.element);
      this.condition = doc && doc[0] && new Condition(doc[0], this);
    }
    return this.condition;
  }

  onConditions(pluginFunction, callback) {
    let faultRule = this,
      steps = faultRule.getSteps();
    if (faultRule.getCondition()) {
      pluginFunction(
        faultRule.getCondition(),
        getcb(`onConditions '${faultRule.getName()}'`),
      );
    }
    if (steps && steps.length > 0) {
      steps.forEach((step, ix) =>
        step.onConditions(pluginFunction, getcb(`onConditions step ${ix}`)),
      );
    }
    callback(null, {});
  }

  onSteps(pluginFunction, callback) {
    let faultRule = this,
      steps = faultRule.getSteps();
    if (steps && steps.length > 0) {
      steps.forEach((step, ix) =>
        step.onSteps(pluginFunction, getcb(`onSteps step ${ix}`)),
      );
    }
    callback(null, {});
  }

  summarize() {
    var summary = {};
    summary.name = this.getName();
    var theSteps = this.getSteps();
    summary.steps = [];
    theSteps.forEach(function (step) {
      summary.steps.push(step.summarize());
    });
    summary.condition =
      (this.getCondition() && this.getCondition().summarize()) || {};
    return summary;
  }
}

//Public
module.exports = FaultRule;
