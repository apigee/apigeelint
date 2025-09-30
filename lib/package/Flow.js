/*
  Copyright 2019-2025 Google LLC

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
  FlowPhase = require("./FlowPhase.js"),
  Condition = require("./Condition.js"),
  lintUtil = require("./lintUtil.js"),
  debug = require("debug")("apigeelint:Flow"),
  getcb = lintUtil.curry(lintUtil.diagcb, debug);

class Flow extends ConfigElement {
  constructor(element, parent) {
    super(element, parent);
    this.condition = null;
    this.flowResponse = null;
    this.flowRequest = null;
    this.sharedflow = null;
    this.description = null;
    this.name = null;
    debug(`Flow ctor: self: ${this.element.tagName}`);
  }

  // override
  getName() {
    if (this.name == null) {
      var attr = xpath.select("./@name", this.element);
      this.name = (attr[0] && attr[0].value) || "";
    }
    debug(`getName(): self: ${this.element.tagName}, name: ${this.name}`);
    return this.name;
  }

  getType() {
    if (!this.type) {
      // Flow | PreFlow || PostFlow || PostClientFlow
      //this.type = xpath.select("name(/*)", this.element);
      this.type = this.element.tagName;
    }
    return this.type;
  }

  getFlowName() {
    if (!this.flowName) {
      this.flowName =
        lintUtil.getFileName(this) +
        ":" +
        lintUtil.buildTagBreadCrumb(this.element);
      if (this.getName()) {
        this.flowName += this.name;
      }
    }
    return this.flowName;
  }

  getDescription() {
    if (this.description == null) {
      const nodes = xpath.select("./Description", this.element);
      this.description =
        (nodes &&
          nodes[0] &&
          nodes[0].childNodes[0] &&
          nodes[0].childNodes[0].nodeValue) ||
        "";
    }
    return this.description;
  }

  getCondition() {
    if (this.condition == null) {
      const n = xpath.select("./Condition", this.element);
      this.condition = n && n[0] && new Condition(n[0], this);
    }
    return this.condition;
  }

  getFlowRequest() {
    debug(`> getFlowRequest: ${this.getFlowName()}`);
    if (this.flowRequest == null) {
      const n = xpath.select("./Request", this.element);
      this.flowRequest = n && n[0] && new FlowPhase(n[0], this);
    }
    debug(`< getFlowRequest`);
    return this.flowRequest;
  }

  getFlowResponse() {
    debug(`> getFlowResponse: ${this.getFlowName()}`);
    let self = this;
    if (this.flowResponse == null) {
      const n = xpath.select("./Response", this.element);
      this.flowResponse = n && n[0] && new FlowPhase(n[0], this);
    }
    debug(`< getFlowResponse ${this.flowResponse}`);
    return this.flowResponse;
  }

  getSharedFlow() {
    debug(`> getSharedFlow: ${this.getFlowName()}`);
    if (this.sharedflow == null) {
      const n = xpath.select("/SharedFlow", this.element);
      this.sharedflow = n && n[0] && new FlowPhase(n[0], this);
    }
    debug(`< getSharedFlow (${this.sharedFlow})`);
    return this.sharedflow;
  }

  onSteps(pluginFunction, callback) {
    let flow = this;
    if (flow.getFlowRequest()) {
      flow.getFlowRequest().onSteps(pluginFunction, getcb(`onSteps Request`));
    }
    if (flow.getFlowResponse()) {
      flow.getFlowResponse().onSteps(pluginFunction, getcb(`onSteps Response`));
    }
    if (flow.getSharedFlow()) {
      flow.getSharedFlow().onSteps(pluginFunction, getcb(`onSteps SharedFlow`));
    }
    callback(null, {});
  }

  onConditions(pluginFunction, callback) {
    let flow = this;
    if (flow.getFlowRequest()) {
      flow
        .getFlowRequest()
        .onConditions(pluginFunction, getcb(`onConditions Request`));
    }
    if (flow.getFlowResponse()) {
      flow
        .getFlowResponse()
        .onConditions(pluginFunction, getcb(`onConditions Response`));
    }
    if (flow.getCondition()) {
      pluginFunction(flow.getCondition(), getcb(`onConditions Flow`));
    }
    callback(null, {});
  }

  summarize() {
    let summary = {
      name: this.getName(),
      description: this.getDescription(),
      type: this.getType(),
      flowName: this.getFlowName(),
      condition: (this.getCondition() && this.getCondition().summarize()) || {},
      requestPhase:
        (this.getFlowRequest() && this.getFlowRequest().summarize()) || {},
      responsePhase:
        (this.getFlowResponse() && this.getFlowResponse().summarize()) || {},
    };
    return summary;
  }
}

//Public
module.exports = Flow;
