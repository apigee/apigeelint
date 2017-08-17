//checkConditionLength.js

var plugin = {
  ruleId: "CC003",
  name: "Condition Length",
  message:
    "Overly long conditions on Stesp are difficult to debug and maintain.",
  fatal: false,
  severity: 1, //warning
  nodeType: "Condition",
  enabled: true
};

var onCondition = function(condition, cb) {
  var lengthLimit = 256,
    expression = condition.getExpression(),
    hadWarn = false;

  if (expression && expression.length > lengthLimit) {
    condition.addMessage({
      source: condition.getExpression(),
      line: condition.getElement().lineNumber,
      column: condition.getElement().columnNumber,
      plugin,
      message:
        plugin.message + " Condition is " + expression.length + " characters."
    });
    hadWarn = true;
  }

  if (typeof cb == "function") {
    cb(null, hadWarn);
  }
};

module.exports = {
  plugin,
  onCondition
};
