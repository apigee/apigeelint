/*
  Copyright 2019-2021 Google LLC

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
/* global describe, it, configuration */

const assert = require("assert"),
      testID = "CC006",
      Bundle = require("../../lib/package/Bundle.js"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin( testID)),
      debug = require("debug")("apigeelint:" + testID);

// generate a full report and check the format of the report
describe(`${testID} - ${plugin.plugin.name}`, function() {
  debug("test configuration: " + JSON.stringify(configuration));
  let bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);
  let report = bundle.getReport();

  it("should create a report object with valid schema", function() {
    let formatter = bl.getFormatter("json.js");

    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }

    let schema = require("./../fixtures/reportSchema.js"),
        Validator = require("jsonschema").Validator,
        v = new Validator(),
        jsonReport = JSON.parse(formatter(bundle.getReport())),
        validationResult = v.validate(jsonReport, schema);
    assert.equal(
      validationResult.errors.length,
      0,
      validationResult.errors
    );
  });
});
