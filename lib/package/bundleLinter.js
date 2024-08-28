/*
  Copyright 2019-2022,2024 Google LLC

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
/* global process */

const fs = require("fs"),
  path = require("path"),
  Bundle = require("./Bundle.js"),
  pluralize = require("pluralize"),
  myUtil = require("./myUtil.js"),
  debug = require("debug")("apigeelint:bundleLinter"),
  getcb = myUtil.curry(myUtil.diagcb, debug);

function contains(a, obj, f) {
  if (!a || !a.length) {
    return false;
  }
  f =
    f ||
    function (lh, rh) {
      return lh === rh;
    };

  for (let i = 0; i < a.length; i++) {
    if (f(a[i], obj)) {
      if (!a[i]) {
        return true;
      }
      return a[i];
    }
  }
  return false;
}

function exportReport(providedPath, stringifiedReport) {
  const constructedPath =
    fs.existsSync(providedPath) && fs.lstatSync(providedPath).isDirectory()
      ? path.join(providedPath, "apigeelint.out")
      : providedPath;
  fs.writeFile(constructedPath, stringifiedReport, "utf8", function (err) {
    if (err) {
      return console.log(err);
    }
    return null;
  });
}

const getPluginPath = () => path.resolve(path.join(__dirname, "plugins"));

const listPlugins = () => fs.readdirSync(getPluginPath()).filter(resolvePlugin);

const listRuleIds = () => listPlugins().map((s) => s.substring(0, 5));

const listExternalRuleIds = (externalDir) =>
  fs
    .readdirSync(externalDir)
    .filter(resolvePlugin)
    .map((s) => s.substring(0, 8));

const listFormatters = () =>
  fs
    .readdirSync(path.join(__dirname, "third_party/formatters"))
    .filter((s) => s.endsWith(".js"));

const lint = function (config, done) {
  return new Bundle(config, function (bundle, err) {
    if (err) {
      return done ? done(null, err) : console.log(err);
    }

    // for each builtin plugin
    const normalizedPath = getPluginPath();
    fs.readdirSync(normalizedPath).forEach(function (file) {
      if (!config.plugins || contains(config.plugins, file)) {
        try {
          executePlugin(normalizedPath + "/" + file, bundle);
        } catch (e) {
          debug("plugin error: " + file + " " + e);
        }
      }
    });

    // for each external plugin
    if (config.externalPluginsDirectory) {
      fs.readdirSync(config.externalPluginsDirectory).forEach(function (file) {
        if (!config.plugins || contains(config.plugins, file)) {
          try {
            executePlugin(
              path.resolve(config.externalPluginsDirectory) + "/" + file,
              bundle
            );
          } catch (e) {
            debug("plugin error: " + file + " " + e);
          }
        }
      });
    }

    const formatter = config.formatter || "json.js",
      formatterImpl = getFormatter(formatter),
      formattedReport = formatterImpl(bundle.getReport());

    if (config.output) {
      if (typeof config.output == "function") {
        config.output(formattedReport);
      }
    } else {
      console.log(formattedReport);
    }

    if (config.writePath) {
      exportReport(config.writePath, formattedReport);
    }

    if (done) {
      done(bundle, null);
    }

    // Exit code should return 1 when there are errors
    if (typeof config.setExitCode == "undefined" || config.setExitCode) {
      bundle.getReport().some(function (value) {
        if (value.errorCount > 0) {
          process.exitCode = 1;
          return;
        }
      });

      // Exit code should return 1 when more than maximum number of warnings allowed
      if (config.maxWarnings >= 0) {
        let warningCount = 0;
        bundle
          .getReport()
          .forEach((report) => (warningCount += report.warningCount));
        if (warningCount > config.maxWarnings) {
          process.exitCode = 1;
          return;
        }
      }
    }
  });
};

var getFormatter = function (format) {
  // default is stylish
  let formatterPath;

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
      throw new Error(
        `There was a problem loading formatter: ${formatterPath}`,
        { cause: ex }
      );
    }
  } else {
    return null;
  }
};

const bfnName = (term) =>
  term == "Bundle" ? "onBundle" : pluralize("on" + term, 2);

const pluginIdRe1 = new RegExp("^[A-Z]{2}[0-9]{3}$");
const pluginIdRe2 = new RegExp("^_.+.js$");

/* exposed for testing */
const resolvePlugin = (idOrFilename) => {
  if (idOrFilename.endsWith(".js")) {
    if (idOrFilename.indexOf("/") < 0) {
      if (!pluginIdRe2.test(idOrFilename)) {
        debug(`resolvePlugin file(${idOrFilename}) , prepending path...`);
        return path.resolve(getPluginPath(), idOrFilename);
      } else return null;
    } else {
      return idOrFilename;
    }
  } else if (pluginIdRe1.test(idOrFilename)) {
    let p = fs
      .readdirSync(path.resolve(getPluginPath()))
      .filter((p) => p.startsWith(idOrFilename) && p.endsWith(".js"));
    if (p.length > 1) {
      throw new Error("plugin conflict: " + JSON.stringify(p));
    }
    return p.length ? path.resolve(getPluginPath(), p[0]) : null;
  }
  return null;
};

const executePlugin = function (file, bundle) {
  let pluginPath = resolvePlugin(file);

  if (pluginPath) {
    debug(`executePlugin file(${pluginPath})`);
    let plugin = require(pluginPath);
    if (
      plugin.plugin.enabled &&
      (!bundle.excluded || bundle.excluded[plugin.plugin.ruleId] !== true)
    ) {
      debug(`execPlugin ${pluginPath}`);
      let basename = path.basename(pluginPath).slice(0, -3),
        entityTypes = [
          "Bundle",
          "Step",
          "Condition",
          "ProxyEndpoint",
          "TargetEndpoint",
          "Resource",
          "Policy",
          "FaultRule",
          "DefaultFaultRule"
        ];

      entityTypes.forEach((etype) => {
        let pfn = plugin["on" + etype];
        if (pfn) {
          let label = `plugin ${basename} on${etype}`;
          debug(label + " start");
          bundle[bfnName(etype)](pfn, getcb(label));
        }
      });
    }
  }
};

module.exports = {
  lint,
  getPluginPath,
  listPlugins,
  listRuleIds,
  listExternalRuleIds,
  listFormatters,
  executePlugin,
  resolvePlugin, // for testing
  getFormatter
};
