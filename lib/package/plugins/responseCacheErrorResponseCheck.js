//responseCacheErrorResponseCheck


var plugin = {
    ruleId: "PO024",
    name: "Cache Error Responses",
    message:
      "By default the ResponseCache policy will cache non 200 responses. Either create a condition or use policy configuration options to exclude non 200 responses.",
    fatal: false,
    severity: 2, //error
    nodeType: "ResponseCache",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  xpath = require("xpath");

var onPolicy = function(policy) {
  var hadWarning = false;
  if (policy.getType() === "ResponseCache") {
    var exclErr = xpath.select(
      "/ResponseCache/ExcludeErrorResponse/text()",
      policy.getElement()
    );

    if (exclErr.length==0 || exclErr[0].data.toUpperCase() !== "TRUE") {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message: "ExcludeErrorResponse is not enabled."
      });
    }
  }
  return hadWarning;
};

module.exports = {
  plugin,
  onPolicy
};
