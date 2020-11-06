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

const assert = require("assert"),
      testID = "CC006",
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin( testID)),
      debug = require("debug")("apigeelint:" + testID);

// generate a full report and check the format of the report
describe(`${testID} - ${plugin.plugin.name}`, function() {
  const Bundle = require("../../lib/package/Bundle.js"),
        bl = require("../../lib/package/bundleLinter.js");

  debug("test configuration: " + JSON.stringify(configuration));

  var bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);

  //need a case where we are using ref for the key
  //also prefix

  describe(`Print plugin results`, function() {
    let report = bundle.getReport(),
        formatter = bl.getFormatter("json.js");

    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }
    it("should create a report object with valid schema", function() {
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

  var stylimpl = bl.getFormatter("unix.js");
  var stylReport = stylimpl(bundle.getReport());
  debug("unix formatted report: \n" + stylReport);
});
