/*
  Copyright 2019-2020 Google LLC

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

const fs = require("fs"),
      path = require("path"),
      Bundle = require("./Bundle.js"),
      request = require("request"),
      pluralize = require("pluralize"),
      myUtil = require("./myUtil.js"),
      debug = require("debug")("apigeelint:"),
      getcb = myUtil.curry(myUtil.diagcb, debug);

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
      var normalizedPath = path.join(__dirname, "plugins");
      fs.readdirSync(normalizedPath).forEach(function(file) {
        if (!config.plugins || contains(config.plugins, file)) {
          try {
            executePlugin(normalizedPath + "/" + file, bundle);
          } catch (e) {
            debug("plugin error: " + file + " " + e);
          }
        }
      });
      //for each plugin
      if( config.externalPluginsDirectory ) {
        fs.readdirSync(config.externalPluginsDirectory).forEach(function(file) {
          if (!config.plugins || contains(config.plugins, file)) {
            try {
              // console.log( "External Plugin: " + path.resolve(config.externalPluginsDirectory) + "/" + file );
              executePlugin(path.resolve(config.externalPluginsDirectory) + "/" + file, bundle);
            } catch (e) {
              debug("plugin error: " + file + " " + e);
            }
          }
        });
      }

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
          uri: config.apiUpload.destPath,
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

      // Exit code should return 1 when more than maximum number of warnings allowed
      if(config.maxWarnings >=0){
        let warningCount = 0;
        bundle.getReport().forEach(report => warningCount += report.warningCount);
        if(warningCount > config.maxWarnings){
          process.exitCode = 1;
            return;
        }
      }
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

const bfnName = (term) =>
  (term == 'Bundle') ? 'onBundle' : pluralize('on' + term, 2);

const pluginIdRe = new RegExp('^[A-Z]{2}[0-9]{3}$');

/* exposed for testing */
const resolvePlugin = idOrFilename => {
        if (idOrFilename.endsWith(".js")) {
          if (idOrFilename.indexOf('/') < 0) {
            debug(`executePlugin file(${idOrFilename}) , prepending path...`);
            return path.resolve(__dirname, "plugins", idOrFilename);
          }
          else {
            return idOrFilename;
          }
        }
        else if (pluginIdRe.test(idOrFilename)) {
          let p = fs.readdirSync(path.resolve(__dirname, "plugins")).find( p => p.startsWith(idOrFilename));
          return p ? path.resolve(__dirname, "plugins", p) : null;
        }
        return null;
      };

const executePlugin = function(file, bundle) {
        let pluginPath = resolvePlugin(file);

      if (pluginPath) {
        debug(`executePlugin file(${pluginPath})`);
        let plugin = require(pluginPath);
        if (plugin.plugin.enabled && bundle.excluded[plugin.plugin.ruleId]!==true) {
          debug(`execPlugin ${pluginPath}`);
          let basename = path.basename(pluginPath).slice(0, -3),
              entityTypes = ['Bundle', 'Step', 'Condition',
                             'ProxyEndpoint', 'TargetEndpoint',
                             'Resource', 'Policy', 'FaultRule',
                             'DefaultFaultRule'];

          entityTypes.forEach( etype => {
            let pfn = plugin['on' + etype];
            if (pfn) {
              let label =`plugin ${basename} on${etype}`;
              debug(label + ' start');
              bundle[bfnName(etype)](pfn, getcb(label));
            }
          });
        }
      }
    };

module.exports = {
  lint,
  executePlugin,
  resolvePlugin, // for testing
  getFormatter
};
