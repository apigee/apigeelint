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
    path + "apigeeLint.json",
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
    var policySLOC = 0,
      resourceSLOC = 0;
    bundle.getResources().forEach(function(resource) {
      resourceSLOC += resource.getLines().length;
    });
    bundle.getPolicies().forEach(function(policy) {
      policySLOC += policy.getLines().length;
    });

    var myReq = {
      uri:
        config.apiUpload.destPath ||
        "https://csdata-test.apigee.net/v1/lintresults",
      headers: { "Content-Type": "application/json" },
      json: true,
      method: "POST",
      body: {
        //move these into an auth header
        user: config.apiUpload.user,
        password: config.apiUpload.password,

        organization: config.apiUpload.organization,
        name: bundle.getName(),
        revision: bundle.getRevision(),
        policyCount: bundle.getPolicies().length,
        resourceCount: bundle.getResources().length,
        policySLOC,
        resourceSLOC,
        lintingResults: fmtReport
      }
    };

    var cb = function(err, httpResponse, body) {
      if (err) {
        return console.error("upload failed:", err);
      }
      console.log("Upload successful!  Server responded with:", body);
    };

    console.log("about to make post");
    request.post(myReq, cb);
  }

  if (config.writePath) {
    exportData(config.writePath, fmtReport);
  }
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
  if (file.endsWith(".js")) {
    //lets see if this really is a plugin
    var plugin = require("./plugins/" + file);
    if (plugin.plugin.enabled) {
      plugin.onBundle && plugin.onBundle(bundle);
      plugin.onStep && bundle.onSteps(plugin.onStep);
      plugin.onCondition && bundle.onConditions(plugin.onCondition);
      plugin.onProxyEndpoint && bundle.onProxyEndpoints(plugin.onProxyEndpoint);
      plugin.onTargetEndpoint &&
        bundle.onTargetEndpoints(plugin.onTargetEndpoint);
      plugin.onResource && bundle.onResources(plugin.onResource);
      plugin.onPolicy && bundle.onPolicies(plugin.onPolicy);
      plugin.onFaultRule && bundle.onFaultRules(plugin.onFaultRule);
      plugin.onDefaultFaultRule &&
        bundle.onDefaultFaultRules(plugin.onDefaultFaultRule);
    }
  }
};

module.exports = {
  lint,
  executePlugin,
  getFormatter
};
