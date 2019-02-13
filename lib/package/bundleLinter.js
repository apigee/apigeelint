/*
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var fs = require("fs"),
  path = require("path"),
  Bundle = require("./Bundle.js"),
  request = require("request"),
  async = require("async"),
  debug = require("debug")("bundlelinter:");

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

var lint = function(config, done) {
  new Bundle(config, function(bundle, err) {
    if (err) {
      if (done) {
        done(null, err);
      } else {
        console.log(err);
      }
    } else {
      //for each plugin
	  bundle.excluded = config.excluded;
      var normalizedPath = path.join(__dirname, "plugins");
      fs.readdirSync(normalizedPath).forEach(function(file) {
        if (!config.plugins || contains(config.plugins, file)) {
          try {
            executePlugin(file, bundle);
          } catch (e) {
            debug("plugin error: " + file + " " + e);
          }
        }
      });

      var fmt = config.formatter || "json.js",
        fmtImpl = getFormatter(fmt),
        fmtReport = fmtImpl(bundle.getReport());

      if (config.output) {
        if (typeof config.output == "function") {
          config.output(fmtReport);
        }
      } else {
        console.log(fmtReport);
      }

      if (fmt !== "json.js") {
        (fmt = "json.js"),
          (fmtImpl = getFormatter(fmt)),
          (fmtReport = JSON.parse(fmtImpl(bundle.getReport())));
      } else {
        fmtReport = JSON.parse(fmtReport);
      }

      if (config.writePath) {
        exportData(config.writePath, fmtReport);
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

        var htmlReport = getFormatter("html.js")(bundle.getReport());

        var myReq = {
          uri:
            config.apiUpload.destPath ||
            "https://csdata-test.apigee.net/v1/lintresults",
          headers: {
            "Content-Type": "application/json",
            Authorization: config.apiUpload.authorization
          },
          json: true,
          method: "POST",
          body: {
            authorization: config.apiUpload.authorization,
            organization: config.apiUpload.organization,
            name: bundle.getName(),
            revision: bundle.getRevision(),
            policyCount: bundle.getPolicies().length,
            resourceCount: bundle.getResources().length,
            policySLOC,
            resourceSLOC,
            lintingResults: fmtReport,
            htmlReport
          }
        };

        var cb = function(err, httpResponse, body) {
          if (err) {
            throw new Error("upload failed:", err);
          }
          console.log("Upload successful!  Server responded with:", body);
          bundle.apiUploadResponse=body;
          if (done) {
            done(bundle, null);
          }
        };

        request.post(myReq, cb);
      } else {
        if (done) {
          done(bundle, null);
        }
      }

      // Exit code should return 1 when there are errors
      bundle.getReport().some(function(value){
          if (value.errorCount > 0) {
             process.exitCode = 1;
             return;
          }
      });
    }
  });
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
      formatterPath = `./third_party/formatters/${format}`;
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

var executePlugin = function(file, bundle, callback) {
  if (file.endsWith(".js")) {
    var plugin = require("./plugins/" + file);
    if (plugin.plugin.enabled && bundle.excluded[plugin.plugin.ruleId]!==true) {
      async.parallel(
        [
          function(acb) {
            if (plugin.onBundle) {
              bundle.onBundle(plugin.onBundle, acb);
            } else {
              acb("bundleLinter no onBundle");
            }
          },
          function(acb) {
            if (plugin.onStep) {
              bundle.onSteps(plugin.onStep, acb);
            } else {
              acb("bundleLinter no onStep");
            }
          },
          function(acb) {
            if (plugin.onCondition) {
              bundle.onConditions(plugin.onCondition, acb);
            } else {
              acb("bundleLinter no onCondition");
            }
          },
          function(acb) {
            if (plugin.onProxyEndpoint) {
              bundle.onProxyEndpoints(plugin.onProxyEndpoint, acb);
            } else {
              acb("bundleLinter no onProxyEndpoint");
            }
          },
          function(acb) {
            if (plugin.onTargetEndpoint) {
              bundle.onTargetEndpoints(plugin.onTargetEndpoint, acb);
            } else {
              acb("bundleLinter no onTargetEndpoint");
            }
          },
          function(acb) {
            if (plugin.onResource) {
              bundle.onResources(plugin.onResource, acb);
            } else {
              acb("bundleLinter no onResource");
            }
          },
          function(acb) {
            if (plugin.onPolicy) {
              bundle.onPolicies(plugin.onPolicy, acb);
            } else {
              acb("bundleLinter no onPolicy");
            }
          },
          function(acb) {
            if (plugin.onFaultRule) {
              bundle.onFaultRules(plugin.onFaultRule, acb);
            } else {
              acb("bundleLinter no onFaultRule");
            }
          },
          function(acb) {
            if (plugin.onDefaultFaultRule) {
              bundle.onDefaultFaultRules(plugin.onDefaultFaultRule, acb);
            } else {
              acb("bundleLinter no onDefaultFaultRules");
            }
          }
        ],
        function(err, result) {
          if (typeof callback === "function") {
            if (err) {
              callback(err);
            } else {
              callback(null, result);
            }
          }
        }
      );
    }
  }
};

module.exports = {
  lint,
  executePlugin,
  getFormatter
};
