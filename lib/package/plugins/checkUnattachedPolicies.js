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
  },hadWarnErr=false;

var onPolicy = function(policy, cb) {
  if (!policy.getSteps() || policy.getSteps().length == 0) {
    policy.addMessage({
      plugin,
      message:
        policy.getName() +
        " is not attached to a Step in the bundle.  Remove unused policies."
    });
      hadWarnErr=true;
  }

  if (typeof cb == "function") {
    cb(null,hadWarnErr);
  }
};

module.exports = {
  plugin,
  onPolicy
};
