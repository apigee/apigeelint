//bundleLinter.js
var fs = require("fs"),
  path = require("path"),
  Bundle = require("./Bundle.js"),
  util = require("util");

function contains(a, obj, f) {
  if (!a || !a.length) {
    return false;
  }
  f =
    f ||
    function(lh, rh) {
      return lh === rh;
    };

  for (var i = 0; i < a.length; i++) {
    if (f(a[i], obj)) {
      if (!a[i]) {
        return true;
      }
      return a[i];
    }
  }
  return false;
}

function exportData(path, report) {
  fs.writeFile(
    path + "/resources/apigeelinit.json",
    JSON.stringify(report, null, 4),
    "utf8",
    function(err) {
      if (err) {
        return console.log(err);
      }
    }
  );
}

function getReport(b) {
  var result = { messages:[], filePath:b.proxyRoot, errorCount:0, warningCount:0, fixableErrorCount:0, fixableWarningCount: 0 };

    //here we will adapt to the eslint structure
  /*
  result.messages
  result.filePath
  result.errorCount
  result.warningCount
  result.fixableErrorCount
  result.fixableWarningCount
  message.fatal
  message.severity
  message.line
  message.column
  message.ruleId
  message.source
  message.message
*/

  if (b.messages) {
    b.messages.forEach(function(bundleMessage){
      result.messages.push(
        bundleMessage
      );
    });
  }
  if (b.policies) {
    b.policies.forEach(function(policy) {
      if (
        policy.messages &&
        (policy.getMessages().warnings.length > 0 ||
          policy.getMessages().errors.length > 0)
      ) {
        result.policies.push({
          fileName: policy.getFileName(),
          errors: policy.getMessages().errors,
          warnings: policy.getMessages().warnings
        });
      }
    });
  }
  return b.messages;
}

var lint = function(config) {
  var bundle = new Bundle(config);
  //for each plugin
  var normalizedPath = path.join(__dirname, "plugins");
  fs.readdirSync(normalizedPath).forEach(function(file) {
    if (!config.plugins || contains(config.plugins, file)) {
      executePlugin(file, bundle);
    }
  });
  console.log(
    util.inspect(getReport(bundle), {
      showHidden: true,
      depth: 50,
      maxArrayLength: 100
    })
  );
  exportData(bundle.proxyRoot, getReport(bundle));
};

var getFormatter = function(format) {
  // default is stylish
  var formatterPath;

  format = format || "stylish";
  if (typeof format === "string") {
    format = format.replace(/\\/g, "/");
    // if there's a slash, then it's a file
    if (format.indexOf("/") > -1) {
      const cwd = this.options ? this.options.cwd : process.cwd();
      formatterPath = path.resolve(cwd, format);
    } else {
      formatterPath = `./formatters/${format}`;
    }

    try {
      return require(formatterPath);
    } catch (ex) {
      ex.message = `There was a problem loading formatter: ${formatterPath}\nError: ${ex.message}`;
      throw ex;
    }
  } else {
    return null;
  }
};

var executePlugin = function(file, bundle) {
  //lets see if this really is a plugin
  var plugin = require("./plugins/" + file);
  plugin.onBundle && plugin.onBundle(bundle);
  plugin.onStep && bundle.onSteps(plugin.onStep);
  plugin.onCondition && bundle.onConditions(plugin.onCondition);
  plugin.onProxyEndpoint && bundle.onProxyEndpoints(plugin.onProxyEndpoint);
  plugin.onTargetEndpoint && bundle.onTargetEndpoints(plugin.onTargetEndpoint);
  plugin.onResource && bundle.onResources(plugin.onResource);
  plugin.onPolicy && bundle.onPolicies(plugin.onPolicy);
  plugin.onFaultRules && bundle.onFaultRules(plugin.onFaultRules);
  plugin.onDefaultFaultRule &&
    bundle.onDefaultFaultRule(plugin.onDefaultFaultRule);
};

module.exports = {
  lint,
  executePlugin,
  getReport,
  getFormatter
};
