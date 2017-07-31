//checkUnattachedPolicies.js

var plugin = {
    ruleId: "BN005",
    name: "Check for unattached policies",
    message:
      "Unattached policies are dead code. They should be removed from bundles before releasing the bundle to produciton.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Policy",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  policies = {};

//adding support for FaultRules

var onStep = function(step, cb) {
  //the name tag on a step contains the policy name
  var policyName = step.getName();
  if (!policies[policyName]) {
    policies[policyName] = [];
  }
  policies[policyName].push(step);
  if (typeof(cb) == 'function') {
    cb();
  }
};

var onFaultRule = function(fr, cb) {
  if (fr.getSteps()) {
    fr.getSteps().forEach(function(step) {
      onStep(step);
    });
  }
  if (typeof(cb) == 'function') {
    cb();
  }
};

var onDefaultFaultRule = function(fr, cb) {
  if (fr.getSteps()) {
    fr.getSteps().forEach(function(step) {
      onStep(step);
    });
  }
  if (typeof(cb) == 'function') {
    cb();
  }
};

var onPolicy = function(policy, cb) {
  if (!policies[policy.getName()]) {
    policy.addMessage({
      plugin,
      message:
        policy.getName() +
        " is not attached to a Step in the bundle.  Remove unused policies."
    });
  }
  if (typeof(cb) == 'function') {
    cb();
  }
};

module.exports = {
  plugin,
  onFaultRule,
  onDefaultFaultRule,
  onStep,
  onPolicy
};
