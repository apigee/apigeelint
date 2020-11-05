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

var assert = require("assert"),
  testID = "BN001",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  Validator = require("jsonschema").Validator,
  bl = require("../../lib/package/bundleLinter.js"),
  schema = require("./../fixtures/reportSchema.js");

debug("test configuration: " + JSON.stringify(configuration));
var bundle = new Bundle(configuration);

describe("Print bundle structure results", function() {
  bl.executePlugin(testID, bundle);

  var impl = bl.getFormatter("unix.js");
  if (!impl) {
    assert.fail("formatter implementation not defined");
  }
    bundle.getReport(function(report) {
      report = impl(report);
      debug("unix formatted report: \n" + report);
    });


  it("should create a report object with valid schema", function() {
    let formatter = bl.getFormatter("json.js"),
        v = new Validator(),
        jsonReport = JSON.parse(formatter(bundle.getReport())),
        validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  });

});
