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



var normalizedPath = path.join(__dirname, "../../lib/package/plugins");

describe("Test all plugins", function() {

  var runTests = function(configToRun){

    fs.readdirSync(normalizedPath).forEach(function(file) {
      //is this a js file
      if (file.endsWith(".js")) {
        var bundle = new Bundle(configToRun);
        bl.executePlugin(file, bundle);
  
        it(file + " should create a " + configToRun.source.bundleType + " report object with valid schema.", function() {
          var jsimpl = bl.getFormatter("json.js"),
            v = new Validator(),
            validationResult,
            jsonReport;
  
          bundle.getReport(function(report) {
            var jsonReport = JSON.parse(jsimpl(report));
            validationResult = v.validate(jsonReport, schema);
            assert.equal(
              validationResult.errors.length,
              0,
              validationResult.errors
            );
          });
        });
  
        it(
          file + " should include a " + configToRun.source.bundleType + " plugin definition with a valid schema.",
          function() {
            var v = new Validator(),
              plugin = require("../../lib/package/plugins/" + file),
              validationResult;
  
            assert.notEqual(plugin.plugin, null, "plugin is null on " + file);
  
            validationResult = v.validate(plugin.plugin, pluginSchema);
            assert.equal(
              validationResult.errors.length,
              0,
              validationResult.errors
            );
          }
        );
  
        it(file + " should have a unique " + configToRun.source.bundleType + " ruleId.", function() {
          var plugin = require("../../lib/package/plugins/" + file),
            ids = {};
          //already existists
          if (ids[plugin.plugin.ruleId]) {
            assert.equal(
              file,
              ids[plugin.plugn.ruleId],
              file +
                " and" +
                ids[plugin.plugn.ruleId] +
                " have conflicting ruleIds."
            );
          } else {
            ids[plugin.plugin.ruleId] = file;
          }
        });
      }
    });


  }

  runTests(configuration);
  runTests(sharedflowconfiguration);

});
