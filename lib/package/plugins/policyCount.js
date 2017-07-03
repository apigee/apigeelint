//policyCount.js

//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

var plugin = {
    ruleId: "BN006",
    name: "Check number of policies present in the bundle",
    message:
      "Large bundles can be problematic in development and difficult to maintain.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Bundle"
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onBundle = function(bundle) {
  var limit = 4; //for testing set to 200 on release

  if (bundle.policies && bundle.policies.length > limit) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      nodeType: plugin.nodeType,
      message:
        "Bundle size (" +
        bundle.policies.length +
        ") exceeds recommended limit of " +
        limit +
        ". Consider refactoring into two or more bundles. Large bundle take longer to deploy and are more difficult to debug and maintain."
    };
    bundle.addMessage(result);
  }
};

//var checkBundle = function(bundle) {};

module.exports = {
  plugin,
  onBundle
};
