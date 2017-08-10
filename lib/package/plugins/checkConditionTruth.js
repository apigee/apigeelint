//checkConditionTruth.js

var plugin = {
    ruleId: "CC006",
    name: "Detect Logical Absurdities",
    message: "Conditions should not have internal logic conflicts.",
    fatal: false,
    severity: 2, //error
    nodeType: "Condition",
    enabled: true
  };
  
var onCondition = function(condition, cb) {
  var truthTable = condition.getTruthTable(),
    hadErr = false;
  //truthTable will be null if no condition was present
  if (truthTable && truthTable.getEvaluation() !== "valid") {
    condition.addMessage({
      source: condition.getExpression(),
      line: condition.getElement().lineNumber,
      column: condition.getElement().columnNumber,
      plugin,
      message: "Condition may be a logical absuridty."
    });
    hadErr = true;
  }
  if (typeof cb == "function") {
    cb(hadErr);
  }
};

module.exports = {
  plugin,
  onCondition
};
