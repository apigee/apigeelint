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
  testPN = "checkConditionForLiterals.js",
  debug = require("debug")("apigeelint:" + testPN);

var Condition = require("../../lib/package/Condition.js"),
  plugin = require("../../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(exp, assertion) {
    it(
      'testing if "' + exp + '" includes a literal is ' + assertion + ".",
      function() {
        var doc = new Dom().parseFromString(exp);
        var c = new Condition(doc, this),
          result;

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
            assertion,
            result ? " literal found " : "literal not found"
          );
        });
      }
    );
  };


//now generate a full report and check the format of the report

describe("testing " + testPN, function() {

  test("false", true);
  test("true", true);
  test("true OR false", true);
  test("b=1", false);
  test("b = c AND true", true);
  test("b OR c AND (a OR B AND C or D and True)", true);
  test("true and b!=c", true);
  test("b!=true", false);
  test("b=false", false);
  test("1", true);
  test('"foo"', true);
  test("request.queryparams.foo", false);
  test(
    'request.header.Content-Type = "application/json"',
    false
  );
  test(
    'request.verb = "POST" and request.header.Content-Type = "application/json"',
    false
  );

  var Bundle = require("../../lib/package/Bundle.js"),
    util = require("util"),
    bl = require("../../lib/package/bundleLinter.js");

  debug("test configuration: " + JSON.stringify(configuration));

  var bundle = new Bundle(configuration);
  bl.executePlugin(testPN, bundle);

  //need a case where we are using ref for the key
  //also prefix

  describe("Print " + testPN + " plugin results", function() {
    var report = bundle.getReport(),
      jsimpl = bl.getFormatter("json.js");

    if (!jsimpl) {
      assert("implementation not defined: " + jsimpl);
    } else {
      it("should create a report object with valid schema", function() {
        var schema = require("./../fixtures/reportSchema.js"),
          Validator = require("jsonschema").Validator,
          v = new Validator(),
          validationResult,
          jsonReport;

        var jsonReport = JSON.parse(jsimpl(bundle.getReport()));
        validationResult = v.validate(jsonReport, schema);
        assert.equal(
          validationResult.errors.length,
          0,
          validationResult.errors
        );
      });
    }
  });

  var stylimpl = bl.getFormatter("unix.js");
  var stylReport = stylimpl(bundle.getReport());
  debug("unix formatted report: \n" + stylReport);
});
