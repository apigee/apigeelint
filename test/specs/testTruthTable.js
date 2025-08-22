/*
  Copyright 2019-2020,2025 Google LLC

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
  debug = require("debug")("apigeelint:TruthTableTest"),
  TruthTable = require("../../lib/package/TruthTable.js"),
  test = function (exp, expected) {
    it(`${exp} should be ${expected}`, function () {
      try {
        var tt = new TruthTable(exp),
          evaluation = tt.getEvaluation();

        debug(`evaluation: ${evaluation}`);
      } catch (parseExc) {
        debug(`expected: ${expected}`);
        assert.notEqual("ERR_ASSERTION", parseExc.code);
        debug(`parse Exception: ${JSON.stringify(parseExc)}`);
        debug(`parse Exception: ${parseExc.stack}`);
        assert.equal("exception", expected);
        return;
      }

      assert.equal(
        expected,
        evaluation,
        JSON.stringify({
          truthTable: tt,
          evaluation,
        }),
      );
    });
  };

describe("TruthTable evaluation", function () {
  test("notValidJson == true", "valid");

  // It is not valid to place strings on LHS of expressions.
  // test('"/x/a/b/feed/" Matches "/*/a/*/feed/"', "valid");
  //test('"/Be/ER" Matches "/*/ER" ', "valid");

  test("(recaptcha-valid != true) and (recaptcha-score &lt;= 0.7)", "valid");
  test("(recaptcha-valid != true) and (recaptcha-score &gt; 0.72928)", "valid");
  test("(recaptcha-valid != true) and (recaptcha-score &lt;= 0.0)", "valid");
  test(
    "(recaptcha-valid != true) &amp;&amp; (recaptcha-score &lt;= 0)",
    "valid",
  );
  test(
    "(recaptcha-valid != true) &amp;&amp (recaptcha-score &lt;= 0)",
    "exception",
  );
  test(
    "(recaptcha-valid != true) and (recaptcha-score &lt;= 0.ahdjh)",
    "exception",
  );

  test(
    '((cacheFlag == "false") or (lookupcache.Cache.lookupServiceCalloutAEMGET.cachehit == "false")) and (request.header.channelid := "care")',
    "valid",
  );
  test(
    `!(request.header.Content-Type ~~ "(text|application)\/(xml|([a-z]*\+xml))(;(\s*)(\w)*=(\S*))?") or (request.verb = "GET") or (request.verb="PUT") or (request.verb="DELETE") or (request.verb="PATCH")`,
    "valid",
  );

  test('a Like "foo"', "valid");
  test('a !Like "foo"', "valid");

  // It is not valid to place strings on LHS of expressions.
  // test('"bar" Like "foo"', "absurdity");
  // test('!("bar" Like "foo")', "valid");
  // test('"bar" Not Like "foo"', "valid");

  test('(fault.name Like "InvalidApiKey")', "valid");
  test("", "valid");
  test('a Matches "foo"', "valid");
  // It is not valid to place strings on LHS of expressions.
  // test('"bar" Matches "foo"', "absurdity");
  test('(fault.name Matches "InvalidApiKey")', "valid");

  test("geocodeResponse.content != null", "valid");
  test("geocodeResponse.content = null", "valid");
  test("(geocodeResponse.content = null)", "valid");
  test(
    "(geocodeResponse.content = null) AND (geocodeResponse.content != null)",
    "absurdity",
  );
  test('geocodeResponse.content != "foo"', "valid");
  test('geocodeResponse.content = "foo"', "valid");

  test("false", "absurdity");
  test("true", "valid");
  test("true OR false", "valid");
  test("true AND false", "absurdity");

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
  test("(b)", "exception");
  test("b", "exception");
  test("!b", "exception");
  test("!(b)", "exception");
  test("(!b)", "exception");
  test("b=c and d=e", "valid");
  test("(b=c) and (d=e)", "valid");

  test("(a = b OR c=d) AND a!=b AND c!=d", "absurdity");
  test("b and b", "exception");
  test("(b and b)", "exception");
  test("((b and b))", "exception");
  test("((b) and (b))", "exception");
  test("(b and !b)", "exception");
  test("((b and !b))", "exception");
  test("((b) and (!b))", "exception");
  test("((b) and !(b))", "exception");
  test("b and !b", "exception");

  test('request.verb="POST" and request.verb!="POST"', "absurdity");
  test('(req.pin.value ~~ "[0-9][0-9][0-9][0-9]")', "valid");
  test(
    'req.pin.value="" or req.pin.value=null or not (req.pin.value ~~ "[0-9][0-9][0-9][0-9]")',
    "valid",
  );
  test(
    'purchase_purchase_0__statusLog_0__status!="Authorized" and purchase.paymentmethod.type != "paypal"',
    "valid",
  );
  test("(b=1) and (b!=1)", "absurdity");
  test(
    'request.verb = "GET" and request.verb = "POST" and response.status.code=200',
    "absurdity",
  );
  test('request.verb = "GET" and request.verb != "POST"', "valid");
  test('"GET" =request.verb and request.verb = "POST"', "exception");
  test('request.verb = "GET" and request.verb = "POST"', "absurdity");
  test("(a = b) and (b=c) and (a!=c)", "absurdity");
  test(
    'walletAdjustment.action != "grant" AND walletAdjustment.action != "revoke"',
    "valid",
  );
  test(
    'NOT((request.header.content-type =| "text/xml") OR (request.header.content-type =| "application/xml" ))',
    "valid",
  );
  test(
    `NOT(request.header.auth-type = "passthrough") AND
          NOT (request.header.auth-type = "impersonated") AND
          NOT(request.header.auth-type = "platform") AND
          NOT
          (request.header.auth-type = "indirect")`,
    "valid",
  );
});
