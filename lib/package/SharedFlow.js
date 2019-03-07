//Flow.js

//Private
var xpath = require("xpath"),
  FlowPhase = require("./FlowPhase.js"),
  Condition = require("./Condition.js"),
  async = require("async"),
  myUtil = require("./myUtil.js"),
  debug = require("debug")("bundlelinter:Flow");

function Flow(element, parent) {
  this.parent = parent;
  this.element = element;
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
  if (!this.description) {
    var doc = xpath.select("./Description", this.element);
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
  if (!this.condition) {
    var element = xpath.select("./Condition", this.element);
    this.condition = element && element[0] && new Condition(element[0], this);
  }
  return this.condition;
};

Flow.prototype.getFlowRequest = function() {
  if (!this.flowRequest) {
    //odd... in preflow I need the parentNode
    //in Flow I don't... what is wrong
    var doc = xpath.select("./Request", this.element);
    this.flowRequest = new FlowPhase(doc[0] || "", this);
  }
  return this.flowRequest;
};


Flow.prototype.getFlow = function() {
  if (!this.flow) {
    var doc = xpath.select(".", this.element);
    this.flow = new FlowPhase(doc[0] || "", this);
  }
  return this.flow;
};

Flow.prototype.getFlowResponse = function() {
  if (!this.flowResponse) {
    var doc = xpath.select("./Response", this.element);
    if (doc && doc[0]) {
      this.flowResponse = new FlowPhase(doc[0], this);
    }
  }
  return this.flowResponse;
};

Flow.prototype.getSharedFlow = function() {
  if (!this.flowResponse) {
    var doc = xpath.select(".", this.element);
    if (doc && doc[0]) {
      this.flowResponse = new FlowPhase(doc[0], this);
    }
  }
  return this.flowResponse;
};

Flow.prototype.onSteps = function(pluginFunction, callback) {
  //parallel these
  var flow = this;

  async.parallel(
    [
      function(cb) {
        if (flow.getFlowRequest()) {
          flow.getFlowRequest().onSteps(pluginFunction, cb);
        } else {
          cb("Flow no flowRequest");
        }
      },
      function(cb) {
        if (flow.getFlowResponse()) {
          flow.getFlowResponse().onSteps(pluginFunction, cb);
        } else {
          cb("Flow no flowResponse");
        }
      }
    ],
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    }
  );
};

Flow.prototype.onConditions = function(pluginFunction, callback) {
  //parallel these
  var flow = this;

  async.parallel(
    [
      function(acb) {
        if (flow.getFlowRequest()) {
          flow.getFlowRequest().onConditions(pluginFunction, acb);
        } else {
          acb("Flow no flowRequest");
        }
      },
      function(acb) {
        if (flow.getFlowResponse()) {
          flow.getFlowResponse().onConditions(pluginFunction, acb);
        } else {
          acb("Flow no flowResponse");
        }
      },
      function(acb) {
        if (flow.getCondition()) {
          pluginFunction(flow.getCondition(), acb);
        } else {
          acb("Flow no condition");
        }
      }
    ],
    function(err, result) {
      if (err && !result) {
        callback(err);
      } else {
        callback(err, result);
      }
    }
  );
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
  var summary = {};

  summary.name = this.getName();
  summary.description = this.getDescription();
  summary.type = this.getType();
  summary.flowName = this.getFlowName();
  summary.condition =
    (this.getCondition() && this.getCondition().summarize()) || {};
  summary.requestPhase =
    (this.getFlowRequest() && this.getFlowRequest().summarize()) || {};
  summary.responsePhase =
    (this.getFlowResponse() && this.getFlowResponse().summarize()) || {};
  return summary;
};

//Public
module.exports = Flow;
