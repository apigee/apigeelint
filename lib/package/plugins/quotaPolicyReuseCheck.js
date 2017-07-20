//quotaPolicyReuseCheck
//| &nbsp; |:white_medium_square:| PO023 | Quota Policy Reuse | When the same Quota policy is used more than once you must ensure that the conditions of execution are mutually exclusive or that you intend for a call to count more than once per message processed. |

var plugin = {
    ruleId: "PO023",
    name: "Quota Policy Reuse",
    message:
      "When the same Quota policy is used more than once you must ensure that the conditions of execution are mutually exclusive or that you intend for a call to count more than once per message processed.",
    fatal: false,
    severity: 2, //error
    nodeType: "Quota",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  myUtil = require("../myUtil.js"),
  xpath = require("xpath");

var onPolicy = function(policy) {
  var hadWarning = false;
  if (policy.getType() === "Quota") {
    var attachedCount = policy.getSteps().length;

    if (attachedCount > 1) {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message:
          "Quota policy is enabled more than once (" + attachedCount + ")."
      });
    }
  }
  return hadWarning;
};

module.exports = {
  plugin,
  onPolicy
};
