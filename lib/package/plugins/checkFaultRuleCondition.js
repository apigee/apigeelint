//checkFaultRuleCondition
//FR001 | No Condition on FaultRule | It's not a best practice to have a FaultRule without an
var plugin = {
  ruleId: "FR001",
  name: "No Condition on FaultRule",
  message:
    "A FaultRule without a condition statement will behave like a DefaultFaultRule. Consider either adding a Condition or migrating to DefaultFaultRule.",
  fatal: false,
  severity: 2, //error
  nodeType: "FaultRule",
  enabled: true
};

var onFaultRule = function(faultRule) {
  if (!faultRule.getCondition()||!faultRule.getCondition().getExpression() === "") {
    faultRule.addMessage({
      plugin,
      message: "FaultRule has no Condition or the Condition is empty."
    });
  }
};

module.exports = {
  plugin,
  onFaultRule
};
