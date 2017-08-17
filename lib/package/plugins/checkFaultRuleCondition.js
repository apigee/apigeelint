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

var onFaultRule = function(faultRule, cb) {
  var hadErr = false;
  if (
    !faultRule.getCondition() ||
    (faultRule.getCondition() &&
      faultRule.getCondition().getExpression() === "")
  ) {
    faultRule.addMessage({
      plugin,
      message: "FaultRule has no Condition or the Condition is empty."
    });
    hadErr = true;
  }
  if (typeof(cb) == 'function') {
    cb(null, hadErr);
  }
};

module.exports = {
  plugin,
  onFaultRule
};
