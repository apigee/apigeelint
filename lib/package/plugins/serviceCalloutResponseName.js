var plugin = {
    ruleId: "PO020",
    name: "Check ServiceCallout for Response variable name",
    message:
      "Using response for the Response name causes unexepcted side effects.",
    fatal: false,
    severity: 2, //error
    nodeType: "Policy",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  myUtil = require("../myUtil.js");

var onPolicy = function(policy,cb) {
  var hadWarning = false;
  if (
    policy.getType() === "ServiceCallout" &&
    myUtil.selectTagValue(policy, "/ServiceCallout/Response") === "response"
  ) {
    hadWarning = true;
    policy.addMessage({
      plugin,
      message:
        'Policy has a Response variable named "response", this may lead to unexpected side effects. Rename the Resopnse variable.'
    });
  }
  if (typeof(cb) == 'function') {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
