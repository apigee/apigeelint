/*
  Copyright 2019-2020 Google LLC

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
      FlowPhase = require("./FlowPhase.js"),
      Condition = require("./Condition.js"),
      myUtil = require("./myUtil.js"),
      debug = require("debug")("apigeelint:Flow"),
      getcb = myUtil.curry(myUtil.diagcb, debug);

function Flow(element, parent) {
  this.parent = parent;
  this.element = element;
  this.condition = null;
  this.flowResponse = null;
  this.sharedflow = null;
  this.description = null;
}

Flow.prototype.getName = function() {
  if (!this.name) {
    var attr = xpath.select("./@name", this.element);
    this.name = (attr[0] && attr[0].value) || "";
  }
  return this.name;
};

Flow.prototype.getMessages = function() {
  return this.parent.getMessages();
};

Flow.prototype.getType = function() {
  //lets go ahead and look this up
  if (!this.type) {
    this.type = xpath.select("name(/*)", this.element);
  }
  return this.type;
};

Flow.prototype.getFlowName = function() {
  if (!this.flowName) {
    this.flowName =
      myUtil.getFileName(this) + ":" + myUtil.buildTagBreadCrumb(this.element);
    if (this.getName()) {
      this.flowName += this.name;
    }
  }
  return this.flowName;
};

Flow.prototype.getDescription = function() {
  if (this.description == null) {
    let doc = xpath.select("./Description", this.element);
    this.description =
      (doc &&
        doc[0] &&
        doc[0].childNodes[0] &&
        doc[0].childNodes[0].nodeValue) ||
      "";
  }
  return this.description;
};

Flow.prototype.getCondition = function() {
  if (this.condition == null) {
    let element = xpath.select("./Condition", this.element);
    this.condition = element && element[0] && new Condition(element[0], this);
  }
  return this.condition;
};

Flow.prototype.getFlowRequest = function() {
  if (!this.flowRequest) {
    //odd... in preflow I need the parentNode
    //in Flow I don't... what is wrong
    let doc = xpath.select("./Request", this.element);
    this.flowRequest = new FlowPhase(doc[0] || "", this);
  }
  return this.flowRequest;
};

Flow.prototype.getFlowResponse = function() {
  if (this.flowResponse == null) {
    let doc = xpath.select("./Response", this.element);
    this.flowResponse = (doc && doc[0]) ? new FlowPhase(doc[0], this) : false;
  }
  return this.flowResponse;
};

Flow.prototype.getSharedFlow = function() {
  if (this.sharedflow == null) {
    let doc = xpath.select(".", this.element);
    this.sharedflow = doc && doc[0] && new FlowPhase(doc[0], this);
  }
  return this.sharedflow;
};

Flow.prototype.onSteps = function(pluginFunction, callback) {
  let flow = this;
  if (flow.getFlowRequest()) {
    flow.getFlowRequest().onSteps(pluginFunction, getcb(`onSteps Request`));
  }
  if (flow.getFlowResponse()) {
    flow.getFlowResponse().onSteps(pluginFunction, getcb(`onSteps Response`));
  }
  callback(null, {});
};

Flow.prototype.onConditions = function(pluginFunction, callback) {
  let flow = this;
  if (flow.getFlowRequest()) {
    flow.getFlowRequest().onConditions(pluginFunction, getcb(`onConditions Request`));
  }
  if (flow.getFlowResponse()) {
    flow.getFlowResponse().onConditions(pluginFunction, getcb(`onConditions Response`));
  }
  if (flow.getCondition()) {
    pluginFunction(flow.getCondition(), getcb(`onConditions Flow`));
  }
  callback(null, {});
};

Flow.prototype.getElement = function() {
  return this.element;
};

Flow.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

Flow.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
        stop = this.element.nextSibling.lineNumber - 1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

Flow.prototype.getParent = function() {
  return this.parent;
};

Flow.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

Flow.prototype.summarize = function() {
  let summary = {
        name : this.getName(),
        description : this.getDescription(),
        type : this.getType(),
        flowName : this.getFlowName(),
        condition : (this.getCondition() && this.getCondition().summarize()) || {},
        requestPhase : (this.getFlowRequest() && this.getFlowRequest().summarize()) || {},
        responsePhase : (this.getFlowResponse() && this.getFlowResponse().summarize()) || {}
      };
  return summary;
};

//Public
module.exports = Flow;
