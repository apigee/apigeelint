/*
  Copyright © 2019-2021, 2026 Google LLC

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

const assert = require("node:assert"),
  path = require("node:path"),
  fs = require("node:fs"),
  //debug = require("debug")("apigeelint:allplugins"),
  Bundle = require("../../lib/package/Bundle.js"),
  Validator = require("jsonschema").Validator,
  bl = require("../../lib/package/bundleLinter.js"),
  schema = require("./../fixtures/reportSchema.js"),
  pluginSchema = require("./../fixtures/pluginSchema.js");

const pluginPath = path.join(__dirname, "../../lib/package/plugins");

describe("All Plugins", function () {
  const pluginRe = {
    id: new RegExp("^[A-Z]{2}[0-9]{3}$"),
    filename: new RegExp("^([A-Z]{2}[0-9]{3})-(.+?)\\.js$"),
  };

  describe("Static Analysis", function () {
    const knownIds = {};
    const allPlugins = bl.listPlugins();
    it(`checks that there are the expected number of plugins`, function () {
      assert.ok(allPlugins.length > 85);
    });

    allPlugins.forEach((shortFileName) => {
      it(`${shortFileName} should pass validity tests`, function () {
        const fqPluginPath = bl.resolvePlugin(shortFileName);
        assert.ok(fqPluginPath);

        const plugin = require(fqPluginPath).plugin;
        assert.ok(
          shortFileName.match(pluginRe.filename),
          `noncompliant plugin filename [${shortFileName}]`,
        );

        assert.ok(plugin, `plugin not found [${shortFileName}]`);
        assert.ok(plugin.ruleId, `plugin missing ruleId [${shortFileName}]`);
        assert.ok(
          plugin.ruleId.match(pluginRe.id),
          `noncompliant plugin ruleId(${plugin.ruleId}) [${shortFileName}]`,
        );

        if (knownIds[plugin.ruleId]) {
          assert.fail(
            `plugins have equal rule ids: [${shortFileName} ${knownIds[plugin.ruleId]}]`,
          );
        } else {
          knownIds[plugin.ruleId] = shortFileName;
        }
      });
    });
  });

  const runTests = function (configToRun) {
    bl.listPlugins().forEach((shortFileName) => {
      const fqPluginPath = bl.resolvePlugin(shortFileName);
      assert.ok(fqPluginPath);

      const bundle = new Bundle(configToRun);
      bl.executePlugin(shortFileName, bundle);

      bundle.getReport(function (report) {
        let jsimpl = bl.getFormatter("json.js"),
          v = new Validator(),
          validationResult = v.validate(JSON.parse(jsimpl(report)), schema);
        assert.equal(
          validationResult.errors.length,
          0,
          validationResult.errors,
        );
      });

      let v = new Validator(),
        plugin = require(fqPluginPath).plugin;

      assert.ok(plugin, `unexported plugin ${shortFileName}`);

      let validationResult = v.validate(plugin.plugin, pluginSchema);
      assert.equal(validationResult.errors.length, 0, validationResult.errors);
    });
  };

  describe("Smoke test", function () {
    this.timeout(30000);
    this.slow(8000);
    it(`ensures all plugins create a report when run with a proxy`, function () {
      /* global configuration */
      runTests(configuration);
    });

    it(`ensures all plugins create a report when run with a sharedflow`, function () {
      /* global sharedflowconfiguration */
      runTests(sharedflowconfiguration);
    });
  });
});
