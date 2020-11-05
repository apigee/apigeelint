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
      testID = "CC004",
      debug = require("debug")("apigeelint:" + testID),
      Condition = require("../../lib/package/Condition.js"),
      Dom = require("xmldom").DOMParser,
      Validator = require("jsonschema").Validator,
      schema = require("./../fixtures/reportSchema.js"),
      Bundle = require("../../lib/package/Bundle.js"),
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID));

//now generate a full report and check the format of the report

describe(`${testID} - ${plugin.plugin.name}`, function() {

  const test = function(exp, expected) {
      it(`testing condition complexity of "${exp}" expect(${expected})`,
        function() {
          let doc = new Dom().parseFromString(exp),
              c = new Condition(doc, this);

          c.addMessage = function(msg) {
            debug(msg);
          };
          plugin.onCondition(c, function(err, result) {
            assert.equal(
              err,
              undefined,
              err ? " err " : " no err"
            );
            assert.equal(
              result,
              expected,
              result ? " mismatch " : " match"
            );
          });
        }
      );
    };

  test("false", 1);
  test("true OR false", 3);
  test("b = c AND true", 5);
  test("b OR c AND (a OR B AND C or D and True)", 13);
  test(`(access_token = "" or access_token ='')`, 7);

  test(`request.queryparam.limit!=NULL and request.queryparam.limit!="" and request.queryparam.limit > 25 and !((proxy.pathsuffix MatchesPath "/{version}/products/promotionhistory") and (request.verb = "GET") and (verifyapikey.genericVerifyAPIKey.canAccessPromotionHistory=true))`, 24);
  test(`(request.header.Accept == "text/xml;charset=UTF-8")`, 3);

  debug("test configuration: " + JSON.stringify(configuration));

  var bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);

  //need a case where we are using ref for the key
  //also prefix

  describe(`Print plugin results`, function() {
    it("should create a report object with valid schema", function() {
      let report = bundle.getReport(),
          formatter = bl.getFormatter("json.js");
      if (!formatter) {
        assert.fail("formatter implementation not defined");
      }
      let v = new Validator(),
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
