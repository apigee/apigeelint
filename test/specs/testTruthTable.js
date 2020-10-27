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
          var tt = new TruthTable(exp),
              evaluation = tt.getEvaluation();

          assert.equal(
            evaluation,
            assertion,
            JSON.stringify({
              truthTable: tt,
              evaluation
            })
          );
        });
      };

describe("TruthTable", function() {

  test('"/x/a/b/feed/" Matches "/*/a/*/feed/"', "valid");
  test('"/Be/ER" Matches "/*/ER" ', "valid");
  test(
    '((cacheFlag == "false") or (lookupcache.Cache.lookupServiceCalloutAEMGET.cachehit == "false")) and (request.header.channelid := "care")',
    "valid"
  );
  test(`!(request.header.Content-Type ~~ "(text|application)\/(xml|([a-z]*\+xml))(;(\s*)(\w)*=(\S*))?") or (request.verb = "GET") or (request.verb="PUT") or (request.verb="DELETE") or (request.verb="PATCH")`,"valid");
  test('a Like "foo"', "valid");
  test('a !Like "foo"', "valid");
  test('"bar" Like "foo"', "absurdity");
  test('!("bar" Like "foo")', "valid");
  test('"bar" Not Like "foo"', "valid");

  test('(fault.name Like "InvalidApiKey")',"valid");
  test("", "valid");
  test('a Matches "foo"', "valid");
  test('"bar" Matches "foo"', "absurdity");
  test('(fault.name Matches "InvalidApiKey")',"valid");
  test("false", "absurdity");
  test("true", "valid");
  test("true OR false", "valid");
  test("b=1", "valid");
  test("b!=1", "valid");
  test("b=c", "valid");
  test("b=2", "valid");
  test("b!=c", "valid");
  test("b!=b", "absurdity");
  test("true and b!=c", "valid");
  test("b=1 and b!=1", "absurdity");
  test("(b=1)", "valid");
  test("((b=1))", "valid");
  test("(b=1) and (b!=1)", "absurdity");
  test("(b=2)", "valid");
  test("(b=0)", "valid");
  test("(b)", "valid");
  test("b", "valid");
  test("!b", "valid");
  test("!(b)", "valid");
  test("(!b)", "valid");
  test("b=c and d=e", "valid");
  test("(b=c) and (d=e)", "valid");
  test("true AND false", "absurdity");
  test("(a = b OR c=d) AND a!=b AND c!=d", "absurdity");
  test("b and b", "valid");
  test("(b and b)", "valid");
  test("((b and b))", "valid");
  test("((b) and (b))", "valid");
  test("(b and !b)", "absurdity");
  test("((b and !b))", "absurdity");
  test("((b) and (!b))", "absurdity");
  test("((b) and !(b))", "absurdity");
  test("b and !b", "absurdity");
  test('request.verb="POST" and request.verb!="POST"', "absurdity");
  test('(req.pin.value ~~ "[0-9][0-9][0-9][0-9]")', "valid");
  test(
    'req.pin.value="" or req.pin.value=null or not (req.pin.value ~~ "[0-9][0-9][0-9][0-9]")',
    "valid"
  );
  test(
    'purchase_purchase_0__statusLog_0__status!="Authorized" and purchase.paymentmethod.type != "paypal"',
    "valid"
  );
  test("(b=1) and (b!=1)", "absurdity");
  test('request.verb = "GET" and request.verb = "POST" and response.status.code=200', "absurdity");
  test('request.verb = "GET" and request.verb != "POST"', "valid");
  test('"GET" =request.verb and request.verb = "POST"', "absurdity");
  test("(a = b) and (b=c) and (a!=c)", "absurdity");
  test("walletAdjustment.action != \"grant\" AND walletAdjustment.action != \"revoke\"", "valid");

});
