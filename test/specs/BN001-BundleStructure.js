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

const assert = require("node:assert"),
  testID = "BN001",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  Validator = require("jsonschema").Validator,
  bl = require("../../lib/package/bundleLinter.js"),
  schema = require("./../fixtures/reportSchema.js");

describe("BN001 - report results", function () {
  let bundle = null;
  const insure = () => {
    if (bundle == null) {
      debug("test configuration: " + JSON.stringify(configuration));
      bundle = new Bundle(configuration);
      bl.executePlugin(testID, bundle);
    }
  };

  it("should generate a unix-formatted report", () => {
    insure();
    let report = bundle.getReport();
    assert.ok(report);
    let formatterImpl = bl.getFormatter("unix.js");
    assert.ok(formatterImpl);

    let outputReport = formatterImpl(report);
    debug("unix formatted report: \n" + outputReport);
    assert.ok(outputReport);
  });

  it("should create a json-formatted report object with valid schema", function () {
    insure();
    let report = bundle.getReport();
    assert.ok(report);
    let formatter = bl.getFormatter("json.js");
    assert.ok(formatter);
    let v = new Validator(),
      jsonReport = JSON.parse(formatter(report)),
      validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  });
});
