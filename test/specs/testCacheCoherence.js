/*
  Copyright 2019-2021,2025 Google LLC

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
  testID = "BN003",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  Validator = require("jsonschema").Validator,
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  schema = require("./../fixtures/reportSchema.js");

describe(`${testID} - ${plugin.plugin.name}`, function () {
  it("should create a json-formatted report object with valid schema", function () {
    debug("test configuration: " + JSON.stringify(configuration));

    let bundle = new Bundle(configuration);
    bl.executePlugin(testID, bundle);
    let report = bundle.getReport();

    let formatter = bl.getFormatter("json.js");

    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }
    let jsonReport = JSON.parse(formatter(report)),
      v = new Validator(),
      validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  });

  it("should create a unix-formatted report object with valid schema", function () {
    debug("test configuration: " + JSON.stringify(configuration));

    let bundle = new Bundle(configuration);
    bl.executePlugin(testID, bundle);
    let report = bundle.getReport();

    let formatter = bl.getFormatter("unix.js"),
      formattedReport = formatter(report);
    debug("unix formatted report: \n" + formattedReport);
    assert.ok(formattedReport);
  });
});
