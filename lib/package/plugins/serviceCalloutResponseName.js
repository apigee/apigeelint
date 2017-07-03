var plugin = {
    ruleId: "PO020",
    name: "Check ServiceCallout for Response variable name",
    message:
      "Using response for the Response name causes unexepcted side effects.",
    fatal: false,
    severity: 2, //error
    nodeType: "Policy"
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  myUtil = require("../myUtil.js");

var onPolicy = function(policy) {
  if (
    policy.getType() === "ServiceCallout" &&
    myUtil.selectTagValue(policy, "/ServiceCallout/Response") === "response"
  ) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: policy.getSource(),
      line: policy.getElement().lineNumber,
      column: policy.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message:
        'Policy has a Response variable named "response", this may lead to unexpected side effects. Rename the Resopnse variable.'
    };
    policy.addMessage(result);
  }
};

module.exports = {
  plugin,
  onPolicy
};
