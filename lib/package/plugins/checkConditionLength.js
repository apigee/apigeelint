//checkConditionLength.js

var plugin = {
  ruleId: "CC003",
  name: "Condition Length",
  message:
    "Overly long conditions on Stesp are difficult to debug and maintain.",
  fatal: false,
  severity: 2, //warning
  nodeType: "Condition",
  enabled: true
};

var onCondition = function(condition) {
  var lengthLimit = 256,
    expression = condition.getExpression();

  if (expression && expression.length > lengthLimit) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: condition.getSource(),
      line: condition.getElement().lineNumber,
      column: condition.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message:
        plugin.message + " Condition is " + expression.length + " characters."
    };
    condition.addMessage(result);
  }
};

module.exports = {
  plugin,
  onCondition
};
