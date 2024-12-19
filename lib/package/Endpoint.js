/*
  Copyright 2019-2024 Google LLC

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
  lintUtil = require("./lintUtil.js"),
  debug = require("debug")("apigeelint:Endpoint"),
  util = require("util"),
  fs = require("fs"),
      path = require("path"),
  getcb = lintUtil.curry(lintUtil.diagcb, debug),
  HTTPProxyConnection = require("./HTTPProxyConnection.js"),
  HTTPTargetConnection = require("./HTTPTargetConnection.js"),
  bundleTypes = require("./BundleTypes.js");

function Endpoint(element, bundle, fname, bundletype) {
  debug(`> new Endpoint() ${fname}`);
  this.bundleType = bundletype ? bundletype : "apiproxy"; //default to apiproxy if bundletype not passed
  this.fileName = fname;
  this.parent = bundle;
  this.element = element;
  this.preFlow = null;
  this.postFlow = null;
  this.postClientFlow = null;
  this.sharedFlow = null;
  this.httpProxyConnection = null;
  this.httpTargetConnection = null;
  this.report = {
    filePath: lintUtil.effectivePath(bundle, fname),
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: []
  };
  debug(`< new Endpoint() ${fname}`);
}

Endpoint.prototype.getName = function () {
  if (!this.name) {
    this.name = xpath.select("string(./@name)", this.element);
  }
  return this.name;
};

Endpoint.prototype.getReport = function () {
  // sort messages by line, column
  this.report.messages.sort((a, b) => {
    if (a.line && !b.line) return -1;
    if (b.line && !a.line) return 1;
    if (a.line == b.line) {
      if (a.column && !b.column) return -1;
      if (b.column && !a.column) return 1;
      return a.column - b.column;
    }
    return a.line - b.line;
  });
  return this.report;
};

Endpoint.prototype.getFileName = function () {
  return this.fileName;
};

Endpoint.prototype.select = function (xs) {
  return xpath.select(xs, this.getElement());
};

Endpoint.prototype.getLines = function (start, stop) {
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

Endpoint.prototype.getSource = function () {
  if (!this.source) {
    const start = this.element.lineNumber - 1,
      stop = Number.MAX_SAFE_INTEGER;
    if (this.element.nextSibling && this.element.nextSibling.lineNumber) {
      this.source = this.element.nextSibling.lineNumber - 1;
    } else {
      this.source = this.getLines(start, stop);
    }
  }
  return this.source;
};

Endpoint.prototype.getType = function () {
  return this.element.tagName;
};

Endpoint.prototype.getProxyName = function () {
  if (!this.proxyName) {
    this.proxyName =
      this.fileName +
      ":" +
      lintUtil.buildTagBreadCrumb(this.element) +
      this.getName();
  }
  return this.proxyName;
};

Endpoint.prototype.getPreFlow = function () {
  debug("> getPreFlow()");
  if (this.preFlow == null) {
    const n = xpath.select("./PreFlow", this.element);
    this.preFlow = n && n[0] && new Flow(n[0], this);
  }
  debug("< getPreFlow()");
  return this.preFlow;
};

Endpoint.prototype.getPostFlow = function () {
  debug("> getPostFlow()");
  if (this.postFlow == null) {
    const n = xpath.select("./PostFlow", this.element);
    this.postFlow = n && n[0] && new Flow(n[0], this);
  }
  debug("< getPostFlow()");
  return this.postFlow;
};

Endpoint.prototype.getPostClientFlow = function () {
  debug("> getPostClientFlow()");
  if (this.postClientFlow == null) {
    const n = xpath.select("./PostClientFlow", this.element);
    this.postClientFlow = n && n[0] && new Flow(n[0], this);
  }
  debug("< getPostClientFlow()");
  return this.postClientFlow;
};

Endpoint.prototype.getSharedFlow = function () {
  debug("> getSharedFlow()");
  if (this.sharedFlow == null) {
    const n = xpath.select("/SharedFlow", this.element);
    this.sharedFlow = n && n[0] && new Flow(n[0], this);
  }
  debug("< getSharedFlow()");
  return this.sharedFlow;
};

Endpoint.prototype.getRouteRules = function () {
  if (!this.routeRules) {
    let ep = this;
    ep.routeRules = xpath
      .select("./RouteRule", this.element)
      .map((elt) => new RouteRule(elt, ep));
  }
  return this.routeRules;
};

Endpoint.prototype.getHTTPProxyConnection = function () {
  if (this.httpProxyConnection == null) {
    const n = xpath.select("./HTTPProxyConnection", this.element);
    this.httpProxyConnection = n && n[0] && new HTTPProxyConnection(n[0], this);
  }
  return this.httpProxyConnection;
};

Endpoint.prototype.getHTTPTargetConnection = function () {
  if (this.httpTargetConnection == null) {
    const n = xpath.select("./HTTPTargetConnection", this.element);
    this.httpTargetConnection =
      n && n[0] && new HTTPTargetConnection(n[0], this);
  }
  return this.httpTargetConnection;
};

Endpoint.prototype.getFlows = function () {
  debug("> getFlows()");
  if (!this.flows) {
    // Flows is always a child of toplevel element
    let nodes = xpath.select("/*/Flows", this.element),
      ep = this,
      flows = [];
    if (nodes) {
      nodes.forEach(function (flowsElement) {
        // get a child flow from here
        xpath.select("Flow", flowsElement).forEach((elt) => {
          if (elt.attributes && elt.attributes[0]) {
            debug(
              `Flow ${elt.attributes[0].name}='${elt.attributes[0].value}'`
            );
          } else {
            debug(`Flow`);
          }
          let f = new Flow(elt, ep);
          debug(`getFlows() flow= ${f.element.tagName}`);
          flows.push(f);
        });
      });
    }
    this.flows = flows;
  }
  debug("< getFlows()");
  return this.flows;
};

Endpoint.prototype.getAllFlows = function () {
  debug("> getAllFlows()");
  if (!this.allFlows) {
    self = this;
    let allFlows = [];

    if (this.bundleType === bundleTypes.BundleType.SHAREDFLOW) {
      allFlows.push(this.getSharedFlow());
    } else {
      allFlows.push(this.getPreFlow());
      allFlows.push(this.getPostFlow());
      allFlows.push(this.getPostClientFlow());
    }

    allFlows.push.apply(allFlows, this.getFlows());
    this.allFlows = allFlows.filter(e => !!e);
  }
  debug("< getAllFlows()");
  return this.allFlows;
};

Endpoint.prototype.getFaultRules = function () {
  debug("> getFaultRules()");
  if (!this.faultRules) {
    const n = xpath.select("./FaultRules/FaultRule", this.element),
      ep = this;
    ep.faultRules = [];
    if (n) {
      n.forEach(function (frElement) {
        ep.faultRules.push(new FaultRule(frElement, ep));
      });
    }
  }
  debug("< getFaultRules()");
  return this.faultRules;
};

Endpoint.prototype.getDefaultFaultRule = function () {
  if (!this.defaultFaultRule) {
    const n = xpath.select("./DefaultFaultRule", this.element),
      ep = this;
    if (n) {
      n.forEach(function (frElement) {
        ep.defaultFaultRule = new FaultRule(frElement, ep);
      });
    }
  }
  return this.defaultFaultRule;
};

Endpoint.prototype.getSteps = function () {
  debug("> getSteps()");
  if (!this.steps) {
    let ep = this,
      steps = [];

    ep.getAllFlows().forEach((flow) => {
      if (flow) {
        const flowphases = flow.getSharedFlow()
          ? [flow.getSharedFlow()]
          : [flow.getFlowRequest(), flow.getFlowResponse()];
        flowphases.forEach((flowphase) => {
          flowphase && steps.push(...flowphase.getSteps());
        });
      }
    });

    ep.getFaultRules().forEach(
      (fr) => fr && fr.getSteps().forEach((step) => steps.push(step))
    );

    if (ep.getDefaultFaultRule()) {
      ep.getDefaultFaultRule()
        .getSteps()
        .forEach((step) => steps.push(step));
    }
    this.steps = steps;
    debug(`  getSteps() found ${steps.length} steps`);
  }
  debug(`< getSteps()`);
  return this.steps;
};

Endpoint.prototype.onSteps = function (pluginFunction, callback) {
  const endpoint = this,
    flows = endpoint.getFlows(),
    faultrules = endpoint.getFaultRules();
  debug(`> onSteps: endpoint name: '${endpoint.getName()}'`);
  try {
    if (endpoint.getPreFlow()) {
      endpoint.getPreFlow().onSteps(pluginFunction, getcb("onSteps preflow"));
    }
    if (flows && flows.length > 0) {
      flows.forEach((fl) =>
        fl.onSteps(pluginFunction, getcb(`onSteps flow '${fl.getName()}'`))
      );
    }

    if (endpoint.getPostFlow()) {
      endpoint.getPostFlow().onSteps(pluginFunction, getcb("onSteps postflow"));
    } else {
      debug("onSteps: no postflow");
    }
    if (endpoint.getDefaultFaultRule()) {
      debug("onSteps: defaultFaultRule");
      endpoint
        .getDefaultFaultRule()
        .onSteps(pluginFunction, getcb("onSteps dfr"));
    } else {
      debug("onSteps: no defaultFaultRule");
    }

    if (faultrules && faultrules.length > 0) {
      faultrules.forEach((fr) =>
        fr.onSteps(pluginFunction, getcb("onSteps faultrules"))
      );
    } else {
      debug("onSteps: no faultRules");
    }
  } catch (exc1) {
    debug("exception: " + exc1);
    debug(exc1.stack);
  }

  if (callback) callback(null, {});
  debug(`< onSteps: endpoint name: '${endpoint.getName()}'`);
};

Endpoint.prototype.onConditions = function (pluginFunction, callback) {
  const endpoint = this,
    flows = endpoint.getFlows(),
    faultrules = endpoint.getFaultRules(),
    routerules = endpoint.getRouteRules();
  debug(`onConditions: endpoint name: ${endpoint.getName()}`);

  try {
    if (endpoint.getPreFlow()) {
      endpoint
        .getPreFlow()
        .onConditions(pluginFunction, getcb("onConditions preflow"));
    } else {
      debug("onConditions: no PreFlow");
    }
    if (flows && flows.length > 0) {
      flows.forEach((fl) =>
        fl.onConditions(
          pluginFunction,
          getcb(`onConditions flow '${fl.getName()}'`)
        )
      );
    } else {
      debug("onConditions: no Flows");
    }
    if (endpoint.getPostFlow()) {
      endpoint
        .getPostFlow()
        .onConditions(pluginFunction, getcb("onConditions postflow"));
    } else {
      debug("onConditions: no PostFlow");
    }
    if (endpoint.getDefaultFaultRule()) {
      endpoint
        .getDefaultFaultRule()
        .getSteps()
        .forEach((step) =>
          step.onConditions(pluginFunction, getcb("onConditions dfr"))
        );
    } else {
      debug("onConditions: no DefaultFaultRule");
    }
    if (faultrules && faultrules.length > 0) {
      faultrules.forEach((fr) => {
        fr.onConditions(pluginFunction, getcb(`faultrule '${fr.getName()}'`));
        fr.getSteps().forEach((step) =>
          step.onConditions(
            pluginFunction,
            getcb(`onConditions faultrule '${fr.getName()}'`)
          )
        );
      });
    } else {
      debug("onConditions: no FaultRules");
    }
    if (routerules && routerules.length > 0) {
      routerules.forEach((rr) =>
        rr.onConditions(
          pluginFunction,
          getcb(`onConditions routerule '${rr.getName()}'`)
        )
      );
    } else {
      debug("onConditions: no RouteRules");
    }
  } catch (exc1) {
    debug("exception: " + exc1);
    debug(exc1.stack);
  }

  if (callback) callback(null, {});
};

Endpoint.prototype.getElement = function () {
  return this.element;
};

Endpoint.prototype.getParent = function () {
  return this.parent;
};

Endpoint.prototype.addMessage = function (msg) {
  debug(`> addMessage`);
  //Severity should be one of the following: 0 = off, 1 = warning, 2 = error
  if (msg.hasOwnProperty("plugin")) {
    msg.ruleId = msg.plugin.ruleId;
    if (!msg.severity) msg.severity = msg.plugin.severity;
    msg.nodeType = msg.plugin.nodeType;
    delete msg.plugin;
  }
  debug(`addMessage ${msg.ruleId}: ${msg.message}`);

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

Endpoint.prototype.summarize = function () {
  debug("> summarize");
  let summary = {
    name: this.getName(),
    type: this.getType()
  };

  if (this.bundleType === bundleTypes.BundleType.SHAREDFLOW) {
    debug("summarize - is SharedFlow");
    summary.flows = this.getSharedFlow().summarize();
  } else {
    debug("summarize - is Apiproxy");
    summary.proxyName = this.getProxyName();

    let faultRules = this.getFaultRules();
    if (faultRules) {
      summary.faultRules = [];
      faultRules.forEach(function (fr) {
        summary.faultRules.push(fr.summarize());
      });
    }

    summary.defaultFaultRule =
      (this.getDefaultFaultRule() && this.getDefaultFaultRule().summarize()) ||
      {};

    summary.preFlow =
      (this.getPreFlow() && this.getPreFlow().summarize()) || {};

    summary.flows = this.getFlows().map((flow) => flow.summarize());

    summary.postFlow =
      (this.getPostFlow() && this.getPostFlow().summarize()) || {};
    summary.routeRules = this.getRouteRules().map((rr) => rr.summarize());
  }
  return summary;
};

//Public
module.exports = Endpoint;
