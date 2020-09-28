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
/* global describe, it */

const assert = require("assert"),
      decache = require("decache"),
      path = require("path"),
      fs = require("fs"),
      debug = require("debug")("bundlelinter:allplugins"),
      Bundle = require("../../lib/package/Bundle.js"),
      Validator = require("jsonschema").Validator,
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js"),
      schema = require("./../fixtures/reportSchema.js"),
      pluginSchema = require("./../fixtures/pluginSchema.js");

const normalizedPath = path.join(__dirname, "../../lib/package/plugins");

describe("AllPlugins", function() {
  const pluginNamePattern = new RegExp('^[A-Z]{2}[0-9]{3}$');

  describe("StaticAnalysis", function() {
    let knownIds = {};
    fs.readdirSync(normalizedPath).forEach(function(shortFileName) {
      if (shortFileName.endsWith(".js")) {
          let fqPluginPath = path.join(normalizedPath, shortFileName),
              plugin = require(fqPluginPath).plugin;
        it(`${shortFileName} should export a ruleId with a compliant pattern`, function() {
          assert.ok(plugin, `plugin not found [${shortFileName}]`);
          assert.ok(plugin.ruleId, `plugin missing ruleId [${shortFileName}]`);
          assert.ok(plugin.ruleId.match(pluginNamePattern), `noncompliant plugin ruleId(${plugin.ruleId}) [${shortFileName}]`);
        });

        it(`${shortFileName} should export a unique ruleId`, function() {
          if (knownIds[plugin.ruleId]) {
            assert.fail(
              `plugins have equal rule ids: [${shortFileName} ${knownIds[plugin.ruleId]}]`);
          } else {
            knownIds[plugin.ruleId] = shortFileName;
          }
        });
      }
    });
  });

  const runTests = function(configToRun) {
          fs.readdirSync(normalizedPath).forEach(function(shortFileName) {
            //is this a js file
            if (shortFileName.endsWith(".js")) {
              let fqPluginPath = path.join(normalizedPath, shortFileName);

              it(`${shortFileName} with ${configToRun.source.bundleType} should create a report object`,
                 function() {
                   let bundle = new Bundle(configToRun);
                   bl.executePlugin(shortFileName, bundle);

                   bundle.getReport(function(report) {
                     let jsimpl = bl.getFormatter("json.js"),
                         v = new Validator(),
                         validationResult = v.validate(JSON.parse(jsimpl(report)), schema);
                     assert.equal(
                       validationResult.errors.length,
                       0,
                       validationResult.errors
                     );
                   });
                 });

              it(
                `${shortFileName} with ${configToRun.source.bundleType} should return no Validation errors`,
                function() {
                  let v = new Validator(),
                  plugin = require(fqPluginPath).plugin;

                  assert.notEqual(plugin, `unexported plugin ${shortFileName}`);

                  let validationResult = v.validate(plugin.plugin, pluginSchema);
                  assert.equal(
                    validationResult.errors.length,
                    0,
                    validationResult.errors
                  );
                }
              );

            }
          });
        };

  describe("Proxies", function() {
    runTests(configuration);
  });

  describe("SharedFlows", function() {
    runTests(sharedflowconfiguration);
  });
});
