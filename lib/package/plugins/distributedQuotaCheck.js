//distributedQuotaCheck

var plugin = {
    ruleId: "PO022",
    name: "Nondistributed Quota",
    message:
      "When using nondistributed quota the number of allowed calls is influenced by the number of Message Processors (MPs) deployed. This may lead to higher than expected transactions for a given quota as MPs now autoscale.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Quota",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  xpath = require("xpath");

var onPolicy = function(policy) {
  var hadWarning = false;
  if (policy.getType() === "Quota") {
    var distQuotaValue = xpath.select(
      "/Quota/Distributed/text()",
      policy.getElement()
    );

    if (distQuotaValue.length==0 || distQuotaValue[0].data.toUpperCase() !== "TRUE") {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message: "Distributed quota is not enabled."
      });
    }
  }
  return hadWarning;
};

module.exports = {
  plugin,
  onPolicy
};
