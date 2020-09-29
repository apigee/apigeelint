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

const Flow = require("./Flow.js"),
      RouteRule = require("./RouteRule.js"),
      FaultRule = require("./FaultRule.js"),
      xpath = require("xpath"),
      myUtil = require("./myUtil.js"),
      debug = require("debug")("apigeelint:Endpoint"),
      util = require("util"),
      fs = require("fs"),
      getcb = myUtil.curry(myUtil.diagcb, debug),
      HTTPProxyConnection = require("./HTTPProxyConnection.js"),
      HTTPTargetConnection = require("./HTTPTargetConnection.js"),
      bundleTypes = require('./BundleTypes.js');

function Endpoint(element, parent, fname, bundletype) {
  this.bundleType = bundletype ? bundletype : "apiproxy" //default to apiproxy if bundletype not passed
  this.fileName = fname;
  this.parent = parent;
  this.element = element;
  this.report = {
    filePath: fname.substring(fname.indexOf("/" + this.bundleType)),
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: []
  };
}

Endpoint.prototype.getName = function() {
  if (!this.name) {
    this.name = xpath.select("string(./@name)", this.element);
  }
  return this.name;
};

Endpoint.prototype.getReport = function() {
  // sort messages by line, column
  this.report.messages.sort((a, b) => {
    if (a.line && !b.line)
      return -1;
    if (b.line && !a.line)
      return 1;
    if (a.line == b.line) {
      if (a.column && !b.column)
        return -1;
      if (b.column && !a.column)
        return 1;
      return a.column - b.column;
    }
    return a.line - b.line;
  });
  return this.report;
};

Endpoint.prototype.getFileName = function() {
  return this.fileName;
};

Endpoint.prototype.select = function(xs) {
  return xpath.select(xs, this.getElement());
};

Endpoint.prototype.getLines = function(start, stop) {
  //actually parse the source into lines if we haven't already and return the requested subset
  var result = "";
  if (!this.lines) {
    this.lines = fs.readFileSync(this.getFileName()).toString().split("\n");
  }
  //check start and stop
  if (!stop || stop > this.lines.length) {
    stop = this.lines.length;
  }
  if (!start || start < 0) {
    start = 0;
  }
  if (stop > this.lines.length) {
    stop = this.lines.length;
  }
  if (stop < 0) {
    stop = 0;
  }
  if (start > stop) {
    start = stop;
  }

  for (var i = start; i <= stop; i++) {
    result += this.lines[i] + "\n";
  }

  return result;
};

Endpoint.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop = Number.MAX_SAFE_INTEGER;
    if (this.element.nextSibling && this.element.nextSibling.lineNumber) {
      this.source = this.element.nextSibling.lineNumber - 1;
    }
    else {
      this.source = this.getLines(start, stop);
    }
  }
  return this.source;
};

Endpoint.prototype.getType = function() {
  return this.element.tagName;
};

Endpoint.prototype.getProxyName = function() {
  if (!this.proxyName) {
    this.proxyName =
      this.fileName +
      ":" +
      myUtil.buildTagBreadCrumb(this.element) +
      this.getName();
  }
  return this.proxyName;
};

Endpoint.prototype.getPreFlow = function() {
  if (!this.preFlow) {
    //find the preflow tag
    var doc = xpath.select("./PreFlow", this.element);
    if (doc && doc[0]) {
      this.preFlow = new Flow(doc[0], this);
    }
  }
  return this.preFlow;
};

Endpoint.prototype.getPostFlow = function() {
  if (!this.postFlow) {
    //find the preflow tag
    var doc = xpath.select("./PostFlow", this.element);
    if (doc && doc[0]) {
      this.postFlow = new Flow(doc[0], this);
    }
  }
  return this.postFlow;
};
Endpoint.prototype.getPostClientFlow = function() {
  if (!this.postClientFlow) {
    //find the preflow tag
    var doc = xpath.select("./PostClientFlow", this.element);
    if (doc && doc[0]) {
      this.postClientFlow = new Flow(doc[0], this);
    }
  }
  return this.postClientFlow;
};

Endpoint.prototype.getSharedFlow = function() {
  if (!this.sharedFlow) {
    //find the preflow tag
    var doc = xpath.select(".", this.element);
    if (doc && doc[0]) {
      this.sharedFlow = new Flow(doc[0], this);
    }
  }
  return this.sharedFlow;
};

Endpoint.prototype.getRouteRules = function() {
  if (!this.routeRules) {
    var doc = xpath.select("./RouteRule", this.element),
      ep = this;
    ep.routeRules = [];
    if (doc) {
      doc.forEach(function(rrElement) {
        //flows get a flow from here
        ep.routeRules.push(new RouteRule(rrElement, ep));
      });
    }
  }
  return this.routeRules;
};

Endpoint.prototype.getHTTPProxyConnection = function() {
  if (!this.httpProxyConnection) {
    var doc = xpath.select("./HTTPProxyConnection", this.element),
      ep = this;
    if (doc) {
        ep.httpProxyConnection = new HTTPProxyConnection(doc[0], ep);

    }
  }
  return this.httpProxyConnection;
};

Endpoint.prototype.getHTTPTargetConnection = function() {
  if (!this.httpTargetConnection) {
    var doc = xpath.select("./HTTPTargetConnection", this.element),
      ep = this;
    if (doc) {
        ep.httpTargetConnection = new HTTPTargetConnection(doc[0], ep);

    }
  }
  return this.httpTargetConnection;
};

Endpoint.prototype.getFlows = function() {
  if (!this.flows) {
    var doc = xpath.select("//Flows", this.element),
      ep = this;
    ep.flows = [];
    if (doc) {
      doc.forEach(function(flowsElement) {
        //flows get a flow from here
        var fdoc = xpath.select("./Flow", flowsElement);
        if (fdoc) {
          fdoc.forEach(function(flowElement) {
            ep.flows.push(new Flow(flowElement, ep));
          });
        }
      });
    }
  }
  return this.flows;
};

Endpoint.prototype.getAllFlows = function() {
  if (!this.allFlows) {
    self = this;
    this.allFlows = [];

    if(this.bundleType === bundleTypes.BundleType.SHAREDFLOW){
      this.allFlows.push(this.getSharedFlow());
    } else {
      this.allFlows.push(this.getPreFlow());
      this.allFlows.push(this.getPostFlow());
      this.allFlows.push(this.getPostClientFlow());
    }

    var flows = [];
    flows = this.getFlows();
    flows.forEach(function(flow) {
      self.allFlows.push(flow);
    });
  }
  return this.allFlows;
};

Endpoint.prototype.getFaultRules = function() {
  if (!this.faultRules) {
    var doc = xpath.select("./FaultRules/FaultRule", this.element),
        ep = this;
    ep.faultRules = [];
    if (doc) {
      doc.forEach(function(frElement) {
        ep.faultRules.push(new FaultRule(frElement, ep));
      });
    }
  }
  return this.faultRules;
};

Endpoint.prototype.getDefaultFaultRule = function() {
  if (!this.defaultFaultRule) {
    var doc = xpath.select("./DefaultFaultRule", this.element),
      ep = this;
    if (doc) {
      doc.forEach(function(frElement) {
        ep.defaultFaultRule = new FaultRule(frElement, ep);
      });
    }
  }
  return this.defaultFaultRule;
};

Endpoint.prototype.onSteps = function(pluginFunction, callback) {
  const endpoint = this,
        flows = endpoint.getFlows(),
        faultrules = endpoint.getFaultRules();
  debug(`onSteps: endpoint name: '${endpoint.getName()}'`);
  try {

    if (endpoint.getPreFlow()) {
      endpoint.getPreFlow().onSteps(pluginFunction, getcb("onSteps preflow"));
    }
    if (flows && flows.length >0) {
      flows.forEach( fl =>
                     fl.onSteps(pluginFunction, getcb(`onSteps flow '${fl.getName()}'`)));
    }

    if (endpoint.getPostFlow()) {
      endpoint.getPostFlow().onSteps(pluginFunction, getcb('onSteps postflow'));
    } else {
      debug('onSteps: no postflow');
    }
    if (endpoint.getDefaultFaultRule()) {
      debug('onSteps: defaultFaultRule');
      endpoint.getDefaultFaultRule().onSteps(pluginFunction, getcb('onSteps dfr'));
    } else {
      debug('onSteps: no defaultFaultRule');
    }

    if (faultrules && faultrules.length>0) {
      faultrules.forEach( fr =>
                          fr.onSteps(pluginFunction, getcb('onSteps faultrules')) );

    } else {
      debug("onSteps: no faultRules");
    }
  }
  catch (exc1) {
    debug('exception: ' + exc1);
    debug(exc1.stack);
  }

  if (callback)
    callback(null, {});
};

Endpoint.prototype.onConditions = function(pluginFunction, callback) {
  const endpoint = this,
        flows = endpoint.getFlows(),
        faultrules = endpoint.getFaultRules(),
        routerules = endpoint.getRouteRules();
  debug(`onConditions: endpoint name: ' + '${endpoint.getName()}'`);

  try {
    if (endpoint.getPreFlow()) {
      endpoint.getPreFlow().onConditions(pluginFunction, getcb("onConditions preflow"));
    } else {
      debug('onConditions: no PreFlow');
    }
    if (flows && flows.length >0) {
      flows.forEach( fl =>
                     fl.onConditions(pluginFunction, getcb(`onConditions flow '${fl.getName()}'`)));
    } else {
      debug('onConditions: no Flows');
    }
    if (endpoint.getPostFlow()) {
      endpoint.getPostFlow().onConditions(pluginFunction, getcb('onConditions postflow'));
    } else {
      debug('onConditions: no PostFlow');
    }
    if (endpoint.getDefaultFaultRule()) {
      endpoint.getDefaultFaultRule().getSteps().forEach( step =>
                                                         step.onConditions(pluginFunction, getcb('onConditions dfr')));
    } else {
      debug('onConditions: no DefaultFaultRule');
    }
    if (faultrules && faultrules.length>0) {
      faultrules.forEach( fr => {
        fr.onConditions(pluginFunction, getcb(`faultrule '${fr.getName()}'`));
        fr.getSteps().forEach( step =>
                               step.onConditions(pluginFunction, getcb(`onConditions faultrule '${fr.getName()}'`)));
      });
    } else {
      debug("onConditions: no FaultRules");
    }
    if (routerules && routerules.length>0) {
      routerules.forEach( rr =>
                          rr.onConditions(pluginFunction, getcb(`onConditions routerule '${rr.getName()}'`)));
    } else {
      debug("onConditions: no RouteRules");
    }
  }
  catch (exc1) {
    debug('exception: ' + exc1);
    debug(exc1.stack);
  }

  if (callback)
    callback(null, {});
};

Endpoint.prototype.getElement = function() {
  return this.element;
};

Endpoint.prototype.getParent = function() {
  return this.parent;
};

Endpoint.prototype.addMessage = function(msg) {
  //Severity should be one of the following: 0 = off, 1 = warning, 2 = error
  if (msg.hasOwnProperty("plugin")) {
    msg.ruleId = msg.plugin.ruleId;
    if (!msg.severity) msg.severity = msg.plugin.severity;
    msg.nodeType = msg.plugin.nodeType;
    delete msg.plugin;
  }

  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  if (!msg.hasOwnProperty("source") && msg.entity.hasOwnProperty("getSource")) {
    msg.source = msg.entity.getSource();
  }
  if (!msg.hasOwnProperty("line") && msg.entity.hasOwnProperty("getElement")) {
    msg.line = msg.entity.getElement().lineNumber;
  }
  if (
    !msg.hasOwnProperty("column") &&
    msg.entity.hasOwnProperty("getElement")
  ) {
    msg.column = msg.entity.getElement().columnNumber;
  }
  delete msg.entity;

  this.report.messages.push(msg);
  switch (msg.severity) {
    case 1:
      this.report.warningCount++;
      break;
    case 2:
      this.report.errorCount++;
      break;
  }
};

Endpoint.prototype.summarize = function() {
  var summary = {};

  summary.name = this.getName();
  summary.type = this.getType();
  summary.proxyName = this.getProxyName();

  var faultRules = this.getFaultRules();
  if (faultRules) {
    summary.faultRules = [];
    faultRules.forEach(function(fr) {
      summary.faultRules.push(fr.summarize());
    });
  }

  summary.defaultFaultRule =
    (this.getDefaultFaultRule() && this.getDefaultFaultRule().summarize()) ||
    {};

  summary.preFlow = (this.getPreFlow() && this.getPreFlow().summarize()) || {};

  summary.flows = [];
  this.getFlows().forEach(function(flow) {
    summary.flows.push(flow.summarize());
  });
  summary.postFlow =
    (this.getPostFlow() && this.getPostFlow().summarize()) || {};
  summary.routeRules = [];
  this.getRouteRules().forEach(function(rr) {
    summary.routeRules.push(rr.summarize());
  });

  return summary;
};

//Public
module.exports = Endpoint;
