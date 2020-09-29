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
  testPN = "checkConditionLength.js",
  plugin = require("../../lib/package/plugins/" + testPN),
  debug = require("debug")("apigeelint:" + testPN),
  bl = require("../../lib/package/bundleLinter.js"),
  Bundle = require("../../lib/package/Bundle.js"),
  Dom = require("xmldom").DOMParser,
  Condition = require("../../lib/package/Condition.js"),
  test = function(exp, assertion) {
    it(
      'testing condition complexity of "' +
        exp +
        '" expected to see ' +
        assertion +
        ".",
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
            result ? " warning created " : "no warning created"
          );
        });
      }
    );
  };
describe("testing " + testPN, function() {
  test(
    "b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename or b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename or b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename or b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename",
    true
  );
  test("false", false);
  test("true OR false", false);
  test("b = c AND true", false);
});
