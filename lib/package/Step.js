/*
  Copyright 2019,2024-2025 Google LLC

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
  ConfigElement = require("./ConfigElement.js"),
  xpath = require("xpath"),
  lintUtil = require("./lintUtil.js"),
  debug = require("debug")("apigeelint:Step"),
  getcb = lintUtil.curry(lintUtil.diagcb, debug);

class Step extends ConfigElement {
  constructor(element, parent) {
    debug(`Step ctor parent=${parent.constructor.name}`);
    super(element, parent);
    this.policy = false;
  }

  // override
  getName() {
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
  }

  getType() {
    if (!this.type) {
      this.type = xpath.select("name(/*)", this.element);
    }
    return this.type;
  }

  resolvePolicy() {
    if (this.policy === false) {
      this.policy = this.getBundle().getPolicyByName(this.getName());
    }
    return this.policy;
  }

  getFlowName() {
    if (!this.flowName) {
      this.flowName =
        lintUtil.getFileName(this) +
        ":" +
        lintUtil.buildTagBreadCrumb(this.element) +
        this.getName();
    }
    return this.flowName;
  }

  /*
   * FIXME: While the UI drops in FaultRules or FaultFule under Step, it's not
   * valid and never has been.  I think this is an accident and we do not need
   * this here.
   **/
  getFaultRules() {
    if (!this.faultRules) {
      var doc = xpath.select("./FaultRules/FaultRule", this.element),
        st = this;
      st.faultRules = [];
      if (doc) {
        doc.forEach(function (frElement) {
          //flows get a flow from here
          st.faultRules.push(new FaultRule(frElement, st));
        });
      }
    }
    return this.faultRules;
  }

  getCondition() {
    if (!this.condition) {
      var element = xpath.select("./Condition", this.element);
      this.condition = element && element[0] && new Condition(element[0], this);
    }
    return this.condition;
  }

  onConditions(pluginFunction, callback) {
    let step = this,
      faultRules = step.getFaultRules();
    if (step.getCondition()) {
      pluginFunction(
        step.getCondition(),
        getcb(`onConditions ${this.getName()}`),
      );
    }
    if (faultRules && faultRules.length > 0) {
      faultRules.forEach((fr) =>
        fr.onConditions(
          pluginFunction,
          getcb(`onConditions FaultRule '${fr.getName()}'`),
        ),
      );
    }
    callback(null, {});
  }

  onSteps(pluginFunction, callback) {
    let step = this,
      faultRules = step.getFaultRules();
    pluginFunction(step, getcb(`onSteps ${this.getName()}`));

    if (faultRules && faultRules.length > 0) {
      faultRules.forEach((fr) =>
        fr.onSteps(
          pluginFunction,
          getcb(`onSteps FaultRule '${this.getName()}'`),
        ),
      );
    }
    callback(null, {});
  }

  summarize() {
    return {
      name: this.getName(),
      flowName: this.getFlowName(),
      condition: (this.getCondition() && this.getCondition().summarize()) || {},
      faultRules:
        this.getFaultRules() && this.faultRules.map((fr) => fr.summarize()),
    };
  }
}

//Public
module.exports = Step;
