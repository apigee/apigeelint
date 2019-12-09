var plugin = {
    ruleId: "PO025",
    name: "esLint",
    message: "esLint applied to all javascript resource callouts.",
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
      const Linter = require("eslint"),
        linter = new Linter.Linter();
        
      const messages = linter.verify(resource.getContents(), {
          rules: {
              semi: 2
          }
      }, { filename: fname });

      if(messages.length > 0){
        messages.forEach(function(error){
          plugin.severity = error.severity;
          
          var result = {
            plugin,
            source: error.fix.text,
            line: error.line,
            column: error.column,
            message: error.ruleId + ": " + error.nodeType + ": " + error.message
          };
          resource.addMessage(result);
          hadWarnErr=true;
        });
      }
    }
  } catch (e) {
    debugger;
    debug("eslint error" + e);
  }
  if (typeof cb == "function") {
    cb(null, hadWarnErr);
  }
};

module.exports = {
  plugin,
  onResource
};
