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

var assert = require("assert"),
  testPN = "jsHint.js",
  debug = require("debug")("apigeelint:" + testPN),
  Condition = require("../../lib/package/Condition.js"),
  plugin = require("../../lib/package/plugins/" + testPN),
  fs = require("fs"),
  path = require("path"),
  schema = require("./../fixtures/reportSchema.js"),
  Validator = require("jsonschema").Validator,
  pluginPath = path.join(__dirname, "../lib/package/plugins"),
  plugins = [testPN],
  cwd = process.cwd(),
  FindFolder = require("node-find-folder"),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  rootDir = "/Users/davidwallen/Projects/";

process.chdir(rootDir);
var folders = new FindFolder("apiproxy");
process.chdir(cwd);

folders.forEach(function(folder) {
  var config = {
    debug: true,
    source: {
      type: "filesystem",
      path: rootDir + folder
    },
    excluded: {},
    formatter: "table.js"
  };
  var bundle = new Bundle(config);

  plugins.forEach(function(plugin) {
    bl.executePlugin(plugin, bundle);
    it(
      "testcheckConditionTruthManyBundles " +
        testPN +
        ": " +
        plugin +
        " should not blow chunks and create a report object with valid schema for " +
        folder +
        ".",
      function() {
        var jsimpl = bl.getFormatter("json.js"),
          v = new Validator(),
          validationResult,
          jsonReport;

        var jsonReport = JSON.parse(jsimpl(bundle.getReport()));
        validationResult = v.validate(jsonReport, schema);
        assert.equal(
          validationResult.errors.length,
          0,
          validationResult.errors
        );
      }
    );
  });
});
