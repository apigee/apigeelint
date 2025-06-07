/*
  Copyright 2019,2024 Google LLC

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
  ConfigElement = require("./ConfigElement.js"),
  Step = require("./Step.js"),
  lintUtil = require("./lintUtil.js"),
  debug = require("debug")("apigeelint:FlowPhase"),
  getcb = lintUtil.curry(lintUtil.diagcb, debug);

class FlowPhase extends ConfigElement {
  constructor(element, parent) {
    super(element, parent);
    debug(
      `ctor FlowPhase ${element.tagName} parent=${parent.constructor.name}`,
    );
    this.type = "FlowPhase";
  }

  getType() {
    return this.type;
  }

  getPhase() {
    if (!this.phase) {
      this.phase = this.element.tagName;
    }
    return this.phase;
  }

  getSteps() {
    if (!this.steps) {
      let doc = xpath.select("./Step", this.element),
        fp = this;
      fp.steps = [];
      if (doc) {
        doc.forEach(function (stepElement) {
          fp.steps.push(new Step(stepElement, fp));
        });
      }
    }
    return this.steps;
  }

  onSteps(pluginFunction, cb) {
    let steps = this.getSteps();
    if (steps && steps.length > 0) {
      steps.forEach((step, ix) => pluginFunction(step, getcb(`step ${ix}`)));
    }
    cb(null, {});
  }

  onConditions(pluginFunction, cb) {
    let steps = this.getSteps();
    if (steps && steps.length > 0) {
      steps.forEach((step, ix) =>
        step.onConditions(pluginFunction, getcb(`step ${ix}`)),
      );
    }
    cb(null, {});
  }

  summarize = () => ({
    steps: this.getSteps().map((step) => step.summarize()),
  });
}

//Public
module.exports = FlowPhase;
