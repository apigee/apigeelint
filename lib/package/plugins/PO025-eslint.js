
const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId),
      Linter = require("eslint");

const plugin = {
        ruleId,
        name: "esLint",
        message: "esLint applied to all javascript resources.",
        fatal: false,
        severity: 1,
        nodeType: "Resource",
        enabled: true
      };

let hadWarnErr=false;

const onResource = function(resource, cb) {
  try {
    let fname = resource.getFileName();
    if (
      fname.endsWith(".jsc") ||
      fname.endsWith(".js") ||
      fname.endsWith(".json")
    ) {
      const linter = new Linter.Linter(),
            CLIEngine = new Linter.CLIEngine(),
            eslintConfig = CLIEngine.getConfigForFile(resource.path);

      debug(`config(${fname}):` + JSON.stringify(eslintConfig));

      const messages = linter.verify(resource.getContents(), eslintConfig, { filename: fname });

      if(messages.length > 0) {
        messages.forEach(item => {
          debug('item:' + JSON.stringify(item));
          let result = {
                plugin,
                severity: item.severity,
                //source: item.fix.text, // not actually the source
                line: item.line,
                column: item.column,
                message: item.ruleId + ": " + item.nodeType + ": " + item.message
              };
          debug('result:' + JSON.stringify(result));
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
