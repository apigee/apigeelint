//Flow.js

//Private
var xpath = require("xpath"),
    FlowPhase = require("./FlowPhase.js"),
    Condition = require("./Condition.js"),
    myUtil = require("./myUtil.js"),
    debug = require("debug")("bundlelinter:Flow");

function Flow(element, parent) {
    this.parent = parent;
    this.element = element;
}

Flow.prototype.getName = function () {
    if (!this.name) {
        var attr = xpath.select("./@name", this.element);
        this.name = attr[0] && attr[0].value || "";
    }
    return this.name;
};

Flow.prototype.getType = function () {
    return this.element.tagName;
};

Flow.prototype.getFlowName = function () {
    if (!this.flowName) {
        this.flowName = myUtil.getFileName(this) + ":" + myUtil.buildTagBreadCrumb(this.element);
        if (this.getName()) { this.flowName += this.name; }
    }
    return this.flowName;
};

Flow.prototype.getDescription = function () {
    if (!this.description) {
        var doc = xpath.select("./Description", this.element);
        this.description = doc && doc[0] && doc[0].childNodes[0] && doc[0].childNodes[0].nodeValue || "";
    }
    return this.description;
};

Flow.prototype.getCondition = function () {
    if (!this.condition) {
        var doc = xpath.select("./Condition", this.element);
        this.condition = doc && doc[0] && new Condition(doc[0], this);
    }
    return this.condition;
};

Flow.prototype.getFlowRequest = function () {
    if (!this.flowRequest) {
        //odd... in preflow I need the parentNode
        //in Flow I don't... what is wrong
        var doc = xpath.select("./Request", this.element);
        this.flowRequest = new FlowPhase(doc[0] || "", this);
    }
    return this.flowRequest;
};

Flow.prototype.getFlowResponse = function () {
    if (!this.flowResponse) {
        var doc = xpath.select("./Response", this.element);
        if (doc && doc[0]) {
            this.flowResponse = new FlowPhase(doc[0], this);
        }
    }
    return this.flowResponse;
};

Flow.prototype.onSteps = function (pluginFunction) {
    this.getFlowRequest() && this.getFlowRequest().onSteps(pluginFunction);
    this.getFlowResponse() && this.getFlowResponse().onSteps(pluginFunction);
};

Flow.prototype.onConditions = function (pluginFunction) {
    this.getFlowRequest() && this.getFlowRequest().onConditions(pluginFunction);
    this.getFlowResponse() && this.getFlowResponse().onConditions(pluginFunction);
    //the local condition should also be checked
    this.getCondition() && pluginFunction(this.getCondition());
};

Flow.prototype.getElement = function () {
    return this.element;
};

Flow.prototype.getParent = function () {
    return this.parent;
};

Flow.prototype.warn = function (msg) {
    this.parent.warn(msg);
};

Flow.prototype.err = function (msg) {
    this.parent.err(msg);
};

Flow.prototype.summarize = function () {
    var summary = {};

    summary.name = this.getName();
    summary.description = this.getDescription();
    summary.type = this.getType();
    summary.flowName = this.getFlowName();
    summary.condition = this.getCondition() && this.getCondition().summarize() || {};
    summary.requestPhase = this.getFlowRequest() && this.getFlowRequest().summarize() || {};
    summary.responsePhase = this.getFlowResponse() && this.getFlowResponse().summarize() || {};
    return summary;
};


//Public
module.exports = Flow;
