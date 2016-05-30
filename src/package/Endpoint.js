//Endpoint.js

//Private
var Step = require("./Step.js"),
    Policy = require("./Policy.js"),
    Flow = require("./Flow.js"),
    FlowPhase = require("./FlowPhase.js"),
    RouteRule = require("./RouteRule.js"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser,
    myUtil = require("./myUtil.js");

function Endpoint(element, parent, fname) {
    this.fileName = fname;
    this.parent = parent;
    this.element = element;
}

Endpoint.prototype.getName = function() {
    if (!this.name) {
        var doc = xpath.select("/", this.element);
        this.name = myUtil.getAttributeValue(doc[0].documentElement.attributes, "name");
    }
    return this.name;
};

Endpoint.prototype.getType = function() {
    return this.element.tagName;
};

Endpoint.prototype.getProxyName = function() {
    if (!this.proxyName) {
        this.proxyName = this.fileName + ":" + myUtil.buildTagBreadCrumb(this.element) + this.getName();
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

Endpoint.prototype.checkSteps = function(pluginFunction) {
    this.getPreFlow() && this.getPreFlow().checkSteps(pluginFunction);
    this.getFlows() && this.getFlows().forEach(function(fl) { fl.checkSteps(pluginFunction); });
    this.getPostFlow() && this.getPostFlow().checkSteps(pluginFunction);
    //defaultFaultRule
    //FaultRules
};

Endpoint.prototype.checkConditions = function(pluginFunction) {
    this.getPreFlow() && this.getPreFlow().checkConditions(pluginFunction);
    this.getFlows() && this.getFlows().forEach(function(fl) { fl.checkConditions(pluginFunction); });
    this.getPostFlow() && this.getPostFlow().checkConditions(pluginFunction);
    //FaultRules
    //RouteRules
    this.getRouteRules() && this.getRouteRules().forEach(function(rr) { rr.checkConditions(pluginFunction); });
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
    this.parent.err.push(msg);
};

Endpoint.prototype.summarize = function() {
    var summary = {};

    summary.name = this.getName();
    summary.type = this.getType();
    summary.proxyName = this.getProxyName();

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
