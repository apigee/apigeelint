var plugin = {
    ruleId: "PO013",
    name: "jsHint",
    message: "jsHint applied to all javascript resource callouts.",
    fatal: false,
    severity: 1,
    nodeType: "Resource",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name), hadWarnErr=false;

var onResource = function(resource, cb) {
  try {
    var fname = resource.getFileName();
    if (
      fname.endsWith(".jsc") ||
      fname.endsWith(".js") ||
      fname.endsWith(".json")
    ) {
      var jshint = require("jshint");
      //must be a jsc js or json resource
      if (
        !jshint.JSHINT(`/*jshint maxerr: 500 */\n` + resource.getContents())
      ) {
        var errors = jshint.JSHINT.errors;
        //now walk through each error
        errors.forEach(function(error) {
          if (error.code !== "W087") {
            if (error.id === "(error)") {
              plugin.severity = 2;
            } else {
              plugin.severity = 1;
            }
            var result = {
              plugin,
              source: error.evidence,
              line: error.line,
              column: error.character,
              message: error.id + ": " + error.reason
            };
            resource.addMessage(result);
            hadWarnErr=true;
          }
        });
      }
    }
  } catch (e) {
    debugger;
    debug("jshint error" + e);
  }
  if (typeof cb == "function") {
    cb(null, hadWarnErr);
  }
};

module.exports = {
  plugin,
  onResource
};
