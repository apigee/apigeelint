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
      TruthTable = require("../../lib/package/TruthTable.js"),
      test = function(exp, assertion) {
        it(`${exp} should be ${assertion}`, function() {
          var tt = new TruthTable(exp);

          assert.equal(
            tt.getEvaluation(),
            assertion,
            JSON.stringify({
              truthTable: tt,
              evaluation: tt.getEvaluation()
            })
          );
        });
      };

describe("TruthTable StartsWith", function() {

  test('a ="foobar"', "valid");
  test('a StartsWith "foo"', "valid");
  test('a StartsWith "foo" AND a ="foobar"', "valid");
  test('a StartsWith "foo" AND a !="foobar"', "valid");
  test('a StartsWith "foo" AND a !="foo"', "valid");
  test('a StartsWith "foo" AND a ="bar"', "absurdity");
  test('a StartsWith "foo" AND a StartsWith "bar"', "absurdity");
  test('a StartsWith "foo" AND a ="foobar"', "valid");
  test('a StartsWith "boo" AND a ="foobar"', "absurdity");
  test(
    "(a StartsWith b OR c=d) AND (d=c OR x=y) AND a!=b and c=e and e=d and c!=d",
    "absurdity"
  );

});
