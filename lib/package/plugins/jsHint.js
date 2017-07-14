var plugin = {
    ruleId: "PO013",
    name: "jsHint",
    message: "jsHint applied to all javascript resource callouts.",
    fatal: false,
    severity: 1,
    nodeType: "Resource",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onResource = function(resource) {
  try {
    var fname = resource.getFileName();
    if (
      fname.endsWith(".jsc") ||
      fname.endsWith(".js") ||
      fname.endsWith(".json")
    ) {
      var jshint = require("jshint");
      //must be a jsc js or json resource
      if (!jshint.JSHINT(resource.getContents())) {
        var errors = jshint.JSHINT.errors;
        //now walk through each error
        errors.forEach(function(error) {
          if (error.code !== "W087") {
            var result = {
              ruleId: plugin.ruleId,
              severity: 1, //warning
              source: error.evidence,
              line: error.line,
              column: error.character,
              nodeType: plugin.nodeType,
              message: error.id + ": " + error.reason
            };
            if (error.id === "(error)") {
              result.severity = 2;
            }
            resource.addMessage(result);
          }
        });
      }
    }
  } catch (e) {
    debugger;
    debug("jshint error" + e);
  }
};

module.exports = {
  plugin,
  onResource
};
