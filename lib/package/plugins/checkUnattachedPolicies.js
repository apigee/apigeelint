//checkUnattachedPolicies.js

var plugin = {
    ruleId: "BN005",
    name: "Check for unattached policies",
    message:
      "Unattached policies are dead code. They should be removed from bundles before releasing the bundle to produciton.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Policy"
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  policies = {};

//adding support for FaultRules

var onStep = function(step) {
  //the name tag on a step contains the policy name
  var policyName = step.getName();
  if (!policies[policyName]) {
    policies[policyName] = [];
  }
  policies[policyName].push(step);
};

var onFaultRule = function(fr) {
  fr.getSteps().forEach(function(step) {
    onStep(step);
  });
};

var onDefaultFaultRule = function(fr) {
  fr.getSteps().forEach(function(step) {
    onStep(step);
  });
};

var onPolicy = function(policy) {
  if (!policies[policy.getName()]) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: policy.getSource(),
      line: policy.getElement().lineNumber,
      column: policy.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message:
        policy.getName() +
        " is not attached to a Step in the bundle.  Remove unused policies."
    };
    policy.addMessage(result);
  }
};

module.exports = {
  plugin,
  onFaultRule,
  onDefaultFaultRule,
  onStep,
  onPolicy
};
