//Endpoint.js

//Private
var Flow = require("./Flow.js"),
  RouteRule = require("./RouteRule.js"),
  FaultRule = require("./FaultRule.js"),
  xpath = require("xpath"),
  myUtil = require("./myUtil.js"),
  debug = require("debug")("bundlelinter:Endpoint");

function Endpoint(element, parent, fname) {
  this.fileName = fname;
  this.parent = parent;
  this.element = element;
}

Endpoint.prototype.getName = function() {
  if (!this.name) {
    var doc = xpath.select("/", this.element);
    this.name = myUtil.selectAttributeValue(
      doc[0].documentElement.attributes,
      "name"
    );
  }
  return this.name;
};

Endpoint.prototype.getFileName = function() {
  return this.fileName;
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

Endpoint.prototype.getFlows = function() {
  if (!this.flows) {
    var doc = xpath.select("./Flows", this.element),
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
    this.allFlows.push(this.getPreFlow());
    this.allFlows.push(this.getPostFlow());
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

Endpoint.prototype.onSteps = function(pluginFunction) {
  this.getPreFlow() && this.getPreFlow().onSteps(pluginFunction);
  this.getFlows() &&
    this.getFlows().forEach(function(fl) {
      fl.onSteps(pluginFunction);
    });
  this.getPostFlow() && this.getPostFlow().onSteps(pluginFunction);
  //defaultFaultRule
  this.getDefaultFaultRule() &&
    this.getDefaultFaultRule().onSteps(pluginFunction);
  //FaultRules
  this.getFaultRules() &&
    this.getFaultRules().forEach(function(fr) {
      fr.onSteps(pluginFunction);
    });
};

Endpoint.prototype.onConditions = function(pluginFunction) {
  this.getPreFlow() && this.getPreFlow().onConditions(pluginFunction);
  this.getFlows() &&
    this.getFlows().forEach(function(fl) {
      fl.onConditions(pluginFunction);
    });
  this.getPostFlow() && this.getPostFlow().onConditions(pluginFunction);
  //DefaultFaultRule
  this.getDefaultFaultRule() &&
    this.getDefaultFaultRule().getSteps().forEach(function(step) {
      step.onConditions(pluginFunction);
    });
  //FaultRules
  this.getFaultRules() &&
    this.getFaultRules().forEach(function(fr) {
      fr.getSteps().forEach(function(step) {
        step.onConditions(pluginFunction);
      });
    });
  //RouteRules
  this.getRouteRules() &&
    this.getRouteRules().forEach(function(rr) {
      rr.onConditions(pluginFunction);
    });
};

Endpoint.prototype.getElement = function() {
  return this.element;
};

Endpoint.prototype.getParent = function() {
  return this.parent;
};

Endpoint.prototype.warn = function(msg) {
  this.parent.warn(msg);
};

Endpoint.prototype.err = function(msg) {
  this.parent.err(msg);
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

  summary.preFlow = this.getPreFlow().summarize();
  summary.flows = [];
  this.getFlows().forEach(function(flow) {
    summary.flows.push(flow.summarize());
  });
  summary.postFlow = this.getPostFlow().summarize();
  summary.routeRules = [];
  this.getRouteRules().forEach(function(rr) {
    summary.routeRules.push(rr.summarize());
  });

  return summary;
};

//Public
module.exports = Endpoint;
