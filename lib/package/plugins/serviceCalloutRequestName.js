var plugin = {
    ruleId: "PO019",
    name: "Check ServiceCallout for Request variable name",
    message:
      "Using request for the Request name causes unexepcted side effects.",
    fatal: false,
    severity: 2, //error
    nodeType: "Policy",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  myUtil = require("../myUtil.js");

var onPolicy = function(policy, cb) {
  var hadWarning = false;
  if (
    policy.getType() === "ServiceCallout" &&
    myUtil.selectAttributeValue(policy, "/ServiceCallout/Request/@variable") ===
      "request"
  ) {
    hadWarning = true;
    policy.addMessage({
      plugin,
      message:
        'Policy has a Request variable named "request", this may lead to unexpected side effects. Rename the Request variable.'
    });
  }
  if (typeof(cb) == 'function') {
    cb(hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
