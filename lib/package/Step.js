//Step.js

//Private
var Condition = require("./Condition.js"),
    FaultRule = require("./FaultRule.js"),
    xpath = require("xpath"),
    myUtil = require("./myUtil.js");

function Step(element, parent) {
    this.parent = parent;
    this.element = element;
}

Step.prototype.getName = function () {
    if (!this.name) {
        var doc = xpath.select("./Name", this.element);
        this.name = doc && doc[0] && doc[0].childNodes[0] && doc[0].childNodes[0].nodeValue || "";
    }
    return this.name;
};

Step.prototype.getType = function () {
    return this.element.tagName;
};

Step.prototype.getFlowName = function () {
    if (!this.flowName) {
        this.flowName = myUtil.getFileName(this) + ":" + myUtil.buildTagBreadCrumb(this.element) + this.getName();
    }
    return this.flowName;
};

Step.prototype.getFaultRules = function () {
    if (!this.routeRules) {
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
    return this.routeRules;
};

Step.prototype.getCondition = function () {
    if (!this.condition) {
        var doc = xpath.select("./Condition", this.element);
        this.condition = doc && doc[0] && new Condition(doc[0], this);
    }
    return this.condition;
};

Step.prototype.select = function (xs) {
    return xpath.select(xs, this.element);
};

Step.prototype.getElement = function () {
    return this.element;
};

Step.prototype.getParent = function () {
    return this.parent;
};

Step.prototype.warn = function (msg) {
    this.parent.warn(msg);
};

Step.prototype.err = function (msg) {
    this.parent.err(msg);
};


Step.prototype.onConditions = function (pluginFunction) {
    if (this.getCondition()) {
        pluginFunction(this.getCondition());
    }
    //fault rules
};

Step.prototype.summarize = function () {
    var summary = {};
    summary.name = this.getName();
    summary.flowName = this.getFlowName();
    var faultRules = this.getFaultRules();
    if (faultRules) {
        summary.faultRules = [];
        faultRules.forEach(function (fr) {
            summary.faultRules.push(fr.summarize());
        });
    }
    summary.condition = this.getCondition() && this.getCondition().summarize() || {};
    return summary;
};


//Public
module.exports = Step;
