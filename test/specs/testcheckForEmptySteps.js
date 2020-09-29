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
  testPN = "checkForEmptySteps.js",
  debug = require("debug")("apigeelint:" + testPN),
  Step = require("../../lib/package/Step.js"),
  plugin = require("../../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(stepExp, assertion) {
    it("testing " + testPN + " expected to see " + assertion + ".", function() {
      var sDoc = new Dom().parseFromString(stepExp);
      this.getLines = function() {
        return stepExp;
      };
      step = new Step(sDoc.documentElement, this);
      step.addMessage = function(msg) {
        debug(msg);
      };

      plugin.onStep(step, function(err, result) {
         assert.equal(
            err,
            undefined,
            err ? " err " : " no err"
          );
        assert.equal(
          result,
          assertion,
          result
            ? "warning/error was returned"
            : "warning/error was not returned"
        );
      });
    });
  };

describe("testing " + testPN, function() {

  test(
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name>ExtractVariables-4</Name>
  </Step>`,
    false
  );

  test(
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name></Name>
  </Step>`,
    true
  );

  test(
    `
              <Step>
                  <Name>jsonThreatProtection</Name>
                  <Condition>request.verb != "GET"</Condition>
              </Step>
  `,
    false
  );

  var Bundle = require("../../lib/package/Bundle.js"),
    bl = require("../../lib/package/bundleLinter.js"),
    Validator = require("jsonschema").Validator,
    schema = require("./../fixtures/reportSchema.js");

  var bundle = new Bundle(configuration);

  bl.executePlugin(testPN, bundle);
  it(
    testPN +
      " should create a report object with valid schema for " +
      configuration.source.path +
      ".",
    function() {
      var jsimpl = bl.getFormatter("json.js"),
        v = new Validator(),
        validationResult,
        jsonReport;

      var jsonReport = JSON.parse(jsimpl(bundle.getReport()));
      validationResult = v.validate(jsonReport, schema);
      assert.equal(validationResult.errors.length, 0, validationResult.errors);
    }
  );

});
