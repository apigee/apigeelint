//Condition.js
var TruthTable = require("./TruthTable.js");

function Condition(element, parent) {
  this.parent = parent;
  this.element = element;
}

Condition.prototype.getExpression = function() {
  return (
    (this.element.childNodes &&
      this.element.childNodes[0] &&
      this.element.childNodes[0].nodeValue) ||
    ""
  );
};

Condition.prototype.getMessages = function() {
  return this.parent.getMessages();
};

Condition.prototype.getElement = function() {
  return this.element;
};

Condition.prototype.getParent = function() {
  return this.parent;
};

Condition.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

Condition.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop = this.element.nextSibling.lineNumber - 1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

Condition.prototype.getTruthTable = function() {
  if (!this.truthTable) {
    this.truthTable = new TruthTable(this.getExpression());
  }
  return this.truthTable;
};

Condition.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

Condition.prototype.onConditions = function(pluginFunction, cb) {
  pluginFunction(this, cb);
};

Condition.prototype.summarize = function() {
  var summary = {};
  summary.type = "Condition";
  summary.condition = this.getExpression();
  try {
    summary.truthTable = this.getTruthTable();
  } catch (e) {
    //just swallow it
  }
  return summary;
};

//Public
module.exports = Condition;
