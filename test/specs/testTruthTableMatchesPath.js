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

describe("TruthTable MatchesPath", function() {

  test('!(a MatchesPath "c")', "valid");
  test('(a MatchesPath "a") and !(a MatchesPath "c")', "valid");
  test(
    '(a MatchesPath "a"or a MatchesPath "b") and !(a MatchesPath "c")',
    "valid"
  );
  test(
    '(a MatchesPath "a"or a MatchesPath "b") and !(a MatchesPath "c")',
    "valid"
  );
  test(
    '(proxy.pathsuffix MatchesPath "/{version}/products/**"or proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products**") and !(proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products/categories/**"',
    "valid"
  );
  test(
    '(proxy.pathsuffix MatchesPath "/{version}/products/**" or proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products**") and !(proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products/categories/**"',
    "valid"
  );
  test('(a MatchesPath "a") and !(a MatchesPath "a")', "absurdity");


  // REVIEW AssertionError
  // test('proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/paymentmethods/**" and proxy.pathsuffix !MatchesPath "**/initialize" and proxy.pathsuffix !MatchesPath "**/finalize" and request.verb = "GET"',"valid");
  // test('proxy.pathsuffix !MatchesPath "/{version}/profile/{profile.id}/paymentmethods/**")',"valid");
  // test("proxy.pathsuffix MatchesPath \"/{version}/profile/{profile.id}/paymentmethods/**\" and proxy.pathsuffix !MatchesPath \"**/initialize\" ", "valid");
});
