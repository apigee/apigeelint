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
      testID = "ST001",
      debug = require("debug")("apigeelint:" + testID),
      Step = require("../../lib/package/Step.js"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Dom = require("xmldom").DOMParser,
      test = function(caseNum, stepExp, assertion) {
        it(`tests case ${caseNum}, expect(${assertion})`, function() {
          var sDoc = new Dom().parseFromString(stepExp);
          this.getLines = function() {
            return stepExp;
          };
          let step = new Step(sDoc.documentElement, this);
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

describe(`${testID} - ${plugin.plugin.name}`, function() {

  test(
    1,
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name>ExtractVariables-4</Name>
  </Step>`,
    false
  );

  test(
    2,
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name></Name>
  </Step>`,
    true
  );

  test(
    3,
    `
              <Step>
                  <Name>jsonThreatProtection</Name>
                  <Condition>request.verb != "GET"</Condition>
              </Step>
  `,
    false
  );

  const Bundle = require("../../lib/package/Bundle.js"),
        Validator = require("jsonschema").Validator,
        schema = require("./../fixtures/reportSchema.js");

  let bundle = new Bundle(configuration);

  bl.executePlugin(testID, bundle);
  it(`${testID} should create a report object with valid schema for ${configuration.source.path}`,
    function() {
      let formatter = bl.getFormatter("json.js"),
          v = new Validator(),
          jsonReport = JSON.parse(formatter(bundle.getReport())),
          validationResult = v.validate(jsonReport, schema);

      assert.equal(validationResult.errors.length, 0, validationResult.errors);
    });

  var stylimpl = bl.getFormatter("table.js");
  var stylReport=stylimpl(bundle.getReport());
  debug("table formatted report: \n" + stylReport);

});
