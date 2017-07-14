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

var onPolicy = function(policy) {
  if (
    policy.getType() === "ServiceCallout" &&
    myUtil.selectAttributeValue(policy, "/ServiceCallout/Request/@variable") ===
      "request"
  ) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: policy.getSource(),
      line: policy.getElement().lineNumber,
      column: policy.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message:
        'Policy has a Request variable named "request", this may lead to unexpected side effects. Rename the Request variable.'
    };
    policy.addMessage(result);
  }
};

module.exports = {
  plugin,
  onPolicy
};
