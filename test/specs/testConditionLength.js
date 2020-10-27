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
      testID = "CC003",
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      debug = require("debug")("apigeelint:" + testID),
      Dom = require("xmldom").DOMParser,
      Condition = require("../../lib/package/Condition.js"),
      test = function(exp, caseNum, assertion) {
        it(`condition complexity case ${caseNum}, expect(${assertion})`,
           function() {
             let doc = new Dom().parseFromString(exp),
                 c = new Condition(doc, this);

             c.addMessage = function(msg) {
               debug(msg);
             };
             plugin.onCondition(c, function(e, result) {
               assert.equal(e, undefined);
               assert.equal(
                 result,
                 assertion,
                 result ? " warning created " : "no warning created"
               );
             });
           }
        );
      };
describe(`${testID} - ${plugin.plugin.name}`, function() {
  test(
    "b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename or b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename or b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename or b OR c AND (a OR B AND C or D and True) and someverylongname=someotherverylongvariablename",
    1,
    true
  );
  test("false", 2, false);
  test("true OR false", 3, false);
  test("b = c AND true", 4, false);
});
