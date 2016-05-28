//Flow.js

//Private
var xpath = require("xpath"),
    FlowPhase = require("./FlowPhase.js"),
    Dom = require("xmldom").DOMParser,
    myUtil = require("./myUtil.js");

function Flow(element, parent) {
    this.parent = parent;
    this.element = element;
    this.messages = { warnings: [], errors: [] };
}

Flow.prototype.getName = function() {
    if (!this.name) {
        var attr = xpath.select("./@name", this.element);
        this.name = attr[0] && attr[0].value || "";
    }
    return this.name;
};

Flow.prototype.getType = function() {
    if (!this.type) {
        this.type = this.element.tagName;
    }
    return this.type;
};

Flow.prototype.getFlowName = function() {
    if (!this.flowName) {
        this.flowName = myUtil.getFileName(this) + ":" + myUtil.buildTagBreadCrumb(this.element);
        if (this.getName()) { this.flowName += this.name; }
    }
    return this.flowName;
};

Flow.prototype.getDescription = function() {
    if (!this.description) {
        var doc = xpath.select("./Description", this.element);
        this.description = doc && doc[0] && doc[0].childNodes[0] && doc[0].childNodes[0].nodeValue || "";
    }
    return this.description;
};

Flow.prototype.getCondition = function() {
    if (!this.condition) {
        var doc = xpath.select("./Condition", this.element);
        this.condition = doc && doc[0] && doc[0].childNodes[0] && doc[0].childNodes[0].nodeValue || "";
    }
    return this.condition;
};

Flow.prototype.getFlowRequest = function() {
    if (!this.flowRequest) {
        //odd... in preflow I need the parentNode
        //in Flow I don't... what is wrong
        var doc = xpath.select("./Request", this.element);
        if (doc && doc[0]) {
            this.flowRequest = new FlowPhase(doc[0], this);
        }
    }
    return this.flowRequest;
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

Flow.prototype.checkSteps = function(pluginFunction) {
    this.getFlowRequest() && this.getFlowRequest().checkSteps(pluginFunction);
    this.getFlowResponse() && this.getFlowResponse().checkSteps(pluginFunction);
};

Flow.prototype.getElement = function() {
    return this.element;
};

Flow.prototype.getParent = function() {
    return this.parent;
};

Flow.prototype.warn = function(msg) {
    this.parent.warn(msg);
};

Flow.prototype.err = function(msg) {
    this.parent.err(msg);
};

Flow.prototype.getMessages = function() {
    return this.messages;
};


Flow.prototype.summarize = function() {
    var summary = {
        messages: this.messages,
    }
    summary.name = this.getName();
    summary.description = this.getDescription();
    summary.type = this.getType();
    summary.flowName = this.getFlowName();
    summary.condition = this.getCondition();
    summary.requestPhase = this.getFlowRequest() && this.getFlowRequest().summarize() || {};
    summary.responsePhase = this.getFlowResponse() && this.getFlowResponse().summarize() || {};
    return summary;
};


//Public
module.exports = Flow;
