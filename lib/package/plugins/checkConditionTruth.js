//checkConditionTruth.js

var plugin = {
    ruleId: "CC006",
    name: "Detect Logical Absurdities",
    message: "Conditions should not have internal logic conflicts.",
    fatal: false,
    severity: 1,
    nodeType:"Condition",
    enabled:true
  },
  myUtil = require("../myUtil.js");

var onCondition = function(condition) {
  var truthTable = condition.getTruthTable();
  //truthTable will be null if no condition was present
  if (truthTable && truthTable.evaluation !== "valid") {
    var result = {
      fatal: plugin.fatal,
      severity: plugin.severity,
      ruleId: plugin.ruleId,
      filePath: myUtil.getFileName(condition),
      source: condition.getExpression(),
      messages: [
        {
          line: condition.getElement().lineNumber,
          column: condition.getElement().columnNumber,
          message: "Condition may be a logical absuridty."
        }
      ]
    };
    condition.addMessage(result);
  }
};

module.exports = {
  plugin,
  onCondition
};
