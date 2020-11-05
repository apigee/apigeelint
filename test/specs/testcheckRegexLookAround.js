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
      testID = "PO018",
      debug = require("debug")("apigeelint:" + testID),
      Bundle = require("../../lib/package/Bundle.js"),
      Policy = require("../../lib/package/Policy.js"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Dom = require("xmldom").DOMParser,
      test = function(caseNum, exp, assertion) {
        it(`tests case ${caseNum}, expect to see ${assertion}`,
           function() {
             let doc = new Dom().parseFromString(exp),
                 p = new Policy(doc, this);

             p.addMessage = function(msg) {
               debug(msg);
             };
             p.getElement = function() {
               return doc;
             };
             plugin.onPolicy(p, function(err, result) {
               assert.equal(
                 err,
                 undefined,
                 err ? " err " : " no err"
               );
               assert.equal(
                 result,
                 assertion,
                 result ? " (? found " : "(? not found"
               );
             });
           }
          );
      };

//now generate a full report and check the format of the report


describe(`${testID} - ${plugin.plugin.name}`, function() {

  test(
    1,
    '<RegularExpressionProtection async="false" continueOnError="false" enabled="true" name="regExLookAround"><DisplayName>regExLookAround</DisplayName><Source>request</Source><IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables><URIPath><Pattern>.*Exception in thread.*</Pattern></URIPath></RegularExpressionProtection>',
    false
  );
  test(
    2,
    '<RegularExpressionProtection async="false" continueOnError="false" enabled="true" name="regExLookAround"><DisplayName>regExLookAround</DisplayName><Source>request</Source><IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables><URIPath><Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern></URIPath></RegularExpressionProtection>',
    true
  );

  debug("test configuration: " + JSON.stringify(configuration));

  let bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);

  //need a case where we are using ref for the key
  //also prefix

  describe("Print plugin results $(testID)", function() {
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
