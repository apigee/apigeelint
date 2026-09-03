/*
Copyright © 2019-2022, 2025,2026 Google LLC

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
  try {
    fs.writeFileSync(constructedPath, stringifiedReport, { encoding: "utf8" });
    return null;
  } catch (exc1) {
    console.error(exc1.message);
    return exc1;
  }
}

const internalPluginIdRe = new RegExp("^[A-Z]{2}[0-9]{3}$");
const internalPluginFileRe = new RegExp("^[A-Z]{2}[0-9]{3}-.+\\.js$");
const externalPluginIdRe = new RegExp("^EX-[A-Z]{2}[0-9]{3}$");
const externalPluginFileRe = new RegExp("^EX-[A-Z]{2}[0-9]{3}-.+\\.(js|cjs)$");
const nonlibrarySourceRe = new RegExp("^_.+\\.js$");

const endsWithJsOrCjs = (s) => s.endsWith(".js") || s.endsWith(".cjs");

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
    const re = isInternal ? internalPluginIdRe : externalPluginIdRe;
    if (re.test(idOrFilename)) {
      const p = fs
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

/*
 * The minimum length for a plugin descriptor's `message`. The field is the
 * rule-level description consumers display to explain what a rule checks, so a
 * bare restatement of the rule name is not enough to be useful.
 */
const MIN_DESCRIPTOR_MESSAGE_LENGTH = 25;

const descriptorFieldTypes = {
  ruleId: "string",
  name: "string",
  message: "string",
  fatal: "boolean",
  severity: "number",
  nodeType: "string",
  enabled: "boolean",
};

/*
 * Verify that a plugin exports a usable descriptor. This checks structure only
 * - presence, type, the severity enum, and a minimum length for message. Style
 * conventions beyond that (capitalization, terminal punctuation) are enforced
 * by this repo's test suite rather than here, so that out-of-tree plugins
 * loaded via --externalPluginsDirectory are not broken over presentation.
 */
const validatePluginDescriptor = (descriptor, pluginPath) => {
  const reject = (reason) => {
    throw new Error(`invalid plugin descriptor (${pluginPath}): ${reason}`);
  };

  if (!descriptor || typeof descriptor !== "object") {
    reject("the module does not export a plugin descriptor");
  }

  Object.keys(descriptorFieldTypes).forEach((field) => {
    const expectedType = descriptorFieldTypes[field];
    if (typeof descriptor[field] === "undefined") {
      reject(`missing required field '${field}'`);
    }
    if (typeof descriptor[field] !== expectedType) {
      reject(
        `field '${field}' must be of type ${expectedType}, not ${typeof descriptor[field]}`,
      );
    }
  });

  if (![0, 1, 2].includes(descriptor.severity)) {
    reject(
      `field 'severity' must be one of 0 (off), 1 (warning) or 2 (error), not ${descriptor.severity}`,
    );
  }

  if (descriptor.message.length < MIN_DESCRIPTOR_MESSAGE_LENGTH) {
    reject(
      `field 'message' must be at least ${MIN_DESCRIPTOR_MESSAGE_LENGTH} characters; it describes what the rule checks`,
    );
  }
};

const getInternalPluginsPath = () =>
  path.resolve(path.join(__dirname, "plugins"));

const resolveInternalPlugin = getPluginResolver(getInternalPluginsPath(), true);

const listPlugins = () =>
  fs
    .readdirSync(getInternalPluginsPath())
    .filter((fname) => internalPluginFileRe.test(fname));

const listExternalPlugins = (d) =>
  fs.readdirSync(d).filter((fname) => {
    const isNameMatch = externalPluginFileRe.test(fname);
    if (endsWithJsOrCjs(fname) && !isNameMatch && !fname.startsWith("_")) {
      console.warn(
        `Unexpected .js/.cjs file in external plugins directory: ${fname}`,
      );
    }
    return isNameMatch;
  });

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
      return done ? done(null, error) : console.error(error);
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
    bundle.lintExitCode = 0;
    if (typeof config.setExitCode == "undefined" || config.setExitCode) {
      const clidebug = require("debug")("apigeelint:cli");
      bundle.lintExitCode = bundle
        .getReport()
        .find((value) => value.errorCount > 0)
        ? 1
        : 0;
      clidebug(`initial exitCode ${bundle.lintExitCode}`);

      if (!process.exitCode && config.maxWarnings >= 0) {
        const warningCount = bundle
          .getReport()
          .reduce((a, item) => a + item.warningCount, 0);
        if (warningCount > config.maxWarnings) {
          bundle.lintExitCode = 1;
          clidebug(
            `forcibly setting bundle.lintExitCode 1 due to exceeding maxWarnings (${warningCount} > ${config.maxWarnings})`,
          );
        }
      }
    }

    return done ? done(bundle, null) : null;
  });
};

const getFormatter = function (format) {
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

const executePlugin = function (file, bundle) {
  const stats = fs.existsSync(file) && fs.statSync(file);
  const pluginPath =
    stats && stats.isFile() ? file : resolveInternalPlugin(file);

  if (pluginPath) {
    debug(`executePlugin file(${pluginPath})`);
    const plugin = require(pluginPath);
    validatePluginDescriptor(plugin.plugin, pluginPath);
    if (
      plugin.plugin.enabled &&
      (!bundle.excluded || bundle.excluded[plugin.plugin.ruleId] !== true)
    ) {
      debug(`execPlugin ${pluginPath}`);
      const basename = path.basename(pluginPath).slice(0, -3),
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

      const bfnName = (term) =>
        term == "Bundle" ? "onBundle" : pluralize("on" + term, 2);

      entityTypes.forEach((etype) => {
        const pfn = plugin["on" + etype];
        if (pfn) {
          const label = `plugin ${basename} on${etype}`;
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
