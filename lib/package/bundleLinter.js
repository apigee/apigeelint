/*
  Copyright 2019-2022,2025 Google LLC

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

const fs = require("node:fs"),
  path = require("node:path"),
  Bundle = require("./Bundle.js"),
  pluralize = require("pluralize"),
  lintUtil = require("./lintUtil.js"),
  debug = require("debug")("apigeelint:bundleLinter"),
  getcb = lintUtil.curry(lintUtil.diagcb, debug);

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

const internalPluginIdRe = new RegExp("^[A-Z]{2}[0-9]{3}$");
const internalPluginFileRe = new RegExp("^[A-Z]{2}[0-9]{3}-.+\\.js$");
const externalPluginIdRe = new RegExp("^EX-[A-Z]{2}[0-9]{3}$");
const externalPluginFileRe = new RegExp("^EX-[A-Z]{2}[0-9]{3}-.+\\.js$");
const nonlibrarySourceRe = new RegExp("^_.+\\.js$");

/* exposed for testing */
const getPluginResolver = (d, isInternal) => (idOrFilename) => {
  if (idOrFilename.endsWith(".js")) {
    if (idOrFilename.indexOf("/") < 0) {
      if (!nonlibrarySourceRe.test(idOrFilename)) {
        debug(`resolvePlugin file(${idOrFilename}) , prepending path...`);
        return path.resolve(d, idOrFilename);
      } else return null;
    } else {
      return idOrFilename;
    }
  } else {
    let re = isInternal ? internalPluginIdRe : externalPluginIdRe;
    if (re.test(idOrFilename)) {
      let p = fs
        .readdirSync(path.resolve(d))
        .filter((p) => p.startsWith(idOrFilename) && p.endsWith(".js"));
      if (p.length > 1) {
        throw new Error("plugin conflict: " + JSON.stringify(p));
      }
      return p.length ? path.resolve(d, p[0]) : null;
    }
  }
  return null;
};

const getInternalPluginsPath = () =>
  path.resolve(path.join(__dirname, "plugins"));

const resolveInternalPlugin = getPluginResolver(getInternalPluginsPath(), true);

const listPlugins = () =>
  fs
    .readdirSync(getInternalPluginsPath())
    .filter((fname) => internalPluginFileRe.test(fname));

const listExternalPlugins = (d) =>
  fs.readdirSync(d).filter((fname) => externalPluginFileRe.test(fname));

const listRuleIds = () => listPlugins().map((s) => s.substring(0, 5));

const listExternalRuleIds = (d) =>
  listExternalPlugins(d).map((s) => s.substring(0, 8));

const listFormatters = () =>
  fs
    .readdirSync(path.join(__dirname, "third_party/formatters"))
    .filter((s) => s.endsWith(".js"));

const lint = function (config, done) {
  return new Bundle(config, function (bundle, error) {
    if (error) {
      return done ? done(null, error) : console.log(error);
    }

    const executePlugins = (list, pluginsPath) => {
      list.forEach(function (filename) {
        if (!config.plugins || contains(config.plugins, filename)) {
          try {
            executePlugin(path.resolve(pluginsPath, filename), bundle);
          } catch (e) {
            console.error("plugin error: " + filename + " " + e.stack);
          }
        }
      });
    };

    executePlugins(listPlugins(), getInternalPluginsPath());

    if (config.externalPluginsDirectory) {
      executePlugins(
        listExternalPlugins(config.externalPluginsDirectory),
        config.externalPluginsDirectory,
      );
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

    // Exit code should return 1 when there are errors or too many warnings
    if (typeof config.setExitCode == "undefined" || config.setExitCode) {
      process.exitCode = bundle
        .getReport()
        .find((value) => value.errorCount > 0)
        ? 1
        : 0;

      if (!process.exitCode && config.maxWarnings >= 0) {
        let warningCount = bundle
          .getReport()
          .reduce((a, item) => a + item.warningCount, 0);
        if (warningCount > config.maxWarnings) {
          process.exitCode = 1;
        }
      }
    }

    return done ? done(bundle, null) : null;
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
        { cause: ex },
      );
    }
  } else {
    return null;
  }
};

const bfnName = (term) =>
  term == "Bundle" ? "onBundle" : pluralize("on" + term, 2);

const executePlugin = function (file, bundle) {
  const stats = fs.existsSync(file) && fs.statSync(file);
  let pluginPath = stats && stats.isFile() ? file : resolveInternalPlugin(file);

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
          "DefaultFaultRule",
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
  listPlugins,
  listRuleIds,
  listExternalRuleIds,
  listFormatters,
  executePlugin,
  resolvePlugin: resolveInternalPlugin, // for testing
  getFormatter,
};
