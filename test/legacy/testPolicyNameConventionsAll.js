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

var allBundles = require("./multipleBundles.js"),
  assert = require("assert"),
  bl = require("../../lib/package/bundleLinter.js"),
  schema = require("./../fixtures/reportSchema.js"),
  Validator = require("jsonschema").Validator,
  plugin = "policyNameConventions.js";

allBundles(function(bundle, cb) {
  //this will get called in a loop for every proxyFolder
  bl.executePlugin(plugin, bundle, function() {
    it(
      "test" +
        plugin +
        ": should create a report object with valid schema for " +
        bundle.proxyRoot +
        ".",
      function() {
        this.timeout(500);

        var unixImpl = bl.getFormatter("unix.js");

        bundle.getReport(function(report) {
          if (JSON.stringify(report).indexOf("PO007") > 0) {
            console.log(JSON.stringify(report));
          }
        });

        var jsimpl = bl.getFormatter("json.js"),
          v = new Validator(),
          validationResult,
          jsonReport;

        bundle.getReport(function(report) {
          validationResult = v.validate(report, schema);
          assert.equal(
            validationResult.errors.length,
            0,
            validationResult.errors
          );
        });
      }
    );
  });
  if (cb) {
    cb(null, "complete");
  }
});
