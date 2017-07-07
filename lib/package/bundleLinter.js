//bundleLinter.js
var fs = require("fs"),
  path = require("path"),
  Bundle = require("./Bundle.js"),
  request = require("request");

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

var lint = function(config) {
  var bundle = new Bundle(config);
  //for each plugin
  var normalizedPath = path.join(__dirname, "plugins");
  fs.readdirSync(normalizedPath).forEach(function(file) {
    if (!config.plugins || contains(config.plugins, file)) {
      executePlugin(file, bundle);
    }
  });

  var fmt = config.formatter || "json.js",
    fmtImpl = this.getFormatter(fmt),
    fmtReport = fmtImpl(bundle.getReport());

  console.log(fmtReport);

  if (fmt !== "json.js") {
    (fmt = "json.js"), (fmtImpl = this.getFormatter(
      fmt
    )), (fmtReport = JSON.parse(fmtImpl(bundle.getReport())));
  }
  if (config.apiUpload) {
    //refactor to write results to nucleus data store (via proxy)
    //configuration would hold
    //  host - defaults to the cs-data endpoint
    //  user - only via command line
    //  pwd - only via command line
    //  org - we will verify the user has credentials on the org
    //payload will be the json formatted report

    request(
      {
        uri:
          config.apiUpload.destPath ||
          "https://csdata-test.apigee.net/v1/lintresults",
        headers: { "Content-Type": "application/json" },
        json: true,
        method: "POST",
        body: {
          user: config.apiUpload.user,
          password: config.apiUpload.password,
          organization: config.apiUpload.organization,
          lintingResults: fmtReport
        }
      },
      function(err, req, body) {
        if (err) {
          console.log(err);
        } else {
          console.log("linting results submitted");
        }
      }
    );
  }
  exportData(bundle.proxyRoot, fmtReport);
};

var getFormatter = function(format) {
  // default is stylish
  var formatterPath;

  format = format || "stylish.js";
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
    bundle.onDefaultFaultRules(plugin.onDefaultFaultRule);
};

module.exports = {
  lint,
  executePlugin,
  getFormatter
};
