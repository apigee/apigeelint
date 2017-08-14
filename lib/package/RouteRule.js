//RouteRule.js

//Private
var Condition = require("./Condition.js"),
  xpath = require("xpath");

function RouteRule(element, parent) {
  this.parent = parent;
  this.element = element;
}

RouteRule.prototype.getName = function() {
  if (!this.name) {
    var attr = xpath.select("//@name", this.element);
    this.name = (attr[0] && attr[0].value) || "";
  }
  return this.name;
};

RouteRule.prototype.getMessages = function() {
  return this.parent.getMessages();
};

RouteRule.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

RouteRule.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop = this.element.nextSibling.lineNumber - 1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

RouteRule.prototype.getType = function() {
  return this.element.tagName;
};

RouteRule.prototype.getTargetEndpoint = function() {
  if (!this.targetEndpoint) {
    //find the preflow tag
    var doc = xpath.select("./TargetEndpoint", this.element);
    if (doc && doc[0]) {
      this.targetEndpoint =
        (doc && doc[0] && doc[0].childNodes[0].nodeValue) || "";
    }
  }
  return this.targetEndpoint;
};

RouteRule.prototype.getCondition = function() {
  if (!this.condition) {
    var doc = xpath.select("./Condition", this.element);
    this.condition = doc && doc[0] && new Condition(doc[0], this);
  }
  return this.condition;
};

RouteRule.prototype.getElement = function() {
  return this.element;
};

RouteRule.prototype.getParent = function() {
  return this.parent;
};

RouteRule.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

RouteRule.prototype.onConditions = function(pluginFunction) {
  if (this.getCondition()) {
    pluginFunction(this.getCondition());
  }
};

RouteRule.prototype.summarize = function() {
  var summary = {};
  summary.name = this.getName();
  summary.targetEndpoint = this.getTargetEndpoint();
  summary.condition =
    (this.getCondition() && this.getCondition().summarize()) || {};
  return summary;
};

//Public
module.exports = RouteRule;
