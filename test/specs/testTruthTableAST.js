/*
  Copyright 2019-2021,2025 Google LLC

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
/* global describe, it */

const assert = require("assert"),
  expect = require("chai").expect,
  jsonpath = require("jsonpath"),
  debug = require("debug")("apigeelint:TruthTableTest"),
  TruthTable = require("../../lib/package/TruthTable.js"),
  test = function (exp, checks) {
    it(`${exp} should ${"object" == typeof checks ? "produce expected AST" : "throw an error"}`, function () {
      try {
        var tt = new TruthTable(exp),
          actualAst = tt.getAST();
        assert.ok(actualAst);
        debug(`AST: ${JSON.stringify(actualAst, null, 2)}`);
        assert.equal("object", typeof checks);
        Object.keys(checks).forEach((key) => {
          const query = key;
          const expectedValue = checks[key];
          assert.equal(expectedValue, jsonpath.query(actualAst, query));
        });
      } catch (parseExc) {
        debug(`exception in test: ${parseExc}`);
        assert.equal("string", typeof checks);
        assert.equal("parseException", checks);
      }
    });
  };

describe("TruthTable AST", function () {
  test("b!=1", {
    "$.action": "notEquivalence",
    "$.args[0].args[0].type": "variable",
    "$.args[0].args[0].value": "b",
    "$.args[1].args[0].value": 1,
  });
  test("b=2", {
    "$.action": "equivalence",
    "$.args[0].args[0].type": "variable",
    "$.args[0].args[0].value": "b",
    "$.args[1].args[0].value": 2,
  });
  test("b=c", {
    "$.action": "equivalence",
    "$.args[0].args[0].type": "variable",
    "$.args[0].args[0].value": "b",
    "$.args[1].args[0].value": "c",
  });
  test("b!=c", {
    "$.action": "notEquivalence",
    "$.args[0].args[0].type": "variable",
    "$.args[0].args[0].value": "b",
    "$.args[1].args[0].value": "c",
  });

  test("b=c and d=e", {
    "$.action": "conjunction",
    "$.args[0].action": "equivalence",
    "$.args[0].args[0].args[0].type": "variable",
    "$.args[0].args[0].args[0].value": "b",
    "$.args[0].args[1].args[0].value": "c",
    "$.args[1].action": "equivalence",
    "$.args[1].args[0].args[0].type": "variable",
    "$.args[1].args[0].args[0].value": "d",
    "$.args[1].args[1].args[0].value": "e",
  });

  test('request.headers.foo = "myFoo"', {
    "$.action": "equivalence",
    "$.args[0].args[0].type": "variable",
    "$.args[0].args[0].value": "request.headers.foo",
    "$.args[1].args[0].value": "myFoo",
  });

  test("(error.status.code = 429) Or (error.status.code GreaterThan 399)", {
    "$.action": "disjunction",
    "$.args[0].action": "equivalence",
    "$.args[0].args[0].args[0].type": "variable",
    "$.args[0].args[0].args[0].value": "error.status.code",
    "$.args[0].args[1].args[0].value": 429,
    "$.args[1].action": "greaterThan",
    "$.args[1].args[0].args[0].type": "variable",
    "$.args[1].args[0].args[0].value": "error.status.code",
    "$.args[1].args[1].args[0].value": 399,
  });

  // Without parens
  test("error.status.code = 429 Or error.status.code GreaterThan 399", {
    "$.action": "disjunction",
    "$.args[0].action": "equivalence",
    "$.args[0].args[0].args[0].type": "variable",
    "$.args[0].args[0].args[0].value": "error.status.code",
    "$.args[0].args[1].args[0].value": 429,
    "$.args[1].action": "greaterThan",
    "$.args[1].args[0].args[0].type": "variable",
    "$.args[1].args[0].args[0].value": "error.status.code",
    "$.args[1].args[1].args[0].value": 399,
  });

  // unsupported operation
  test(
    "error.status.code = 429 fakeOp error.status.code GreaterThan 399",
    "parseException",
  );

  // more parens than necessary
  test("((error.status.code = 429) and (error.status.code GreaterThan 399))", {
    "$.action": "conjunction",
    "$.args[0].action": "equivalence",
    "$.args[0].args[0].args[0].type": "variable",
    "$.args[0].args[0].args[0].value": "error.status.code",
    "$.args[0].args[1].args[0].value": 429,
    "$.args[1].action": "greaterThan",
    "$.args[1].args[0].args[0].type": "variable",
    "$.args[1].args[0].args[0].value": "error.status.code",
    "$.args[1].args[1].args[0].value": 399,
  });

  const testAst = function (exp, expected) {
    it(`${exp} should parse correctly`, function () {
      try {
        var tt = new TruthTable(exp),
          ast = tt.getAST();

        debug(`ast: ${ast}`);
      } catch (parseExc) {
        debug(`expected: ${expected}`);
        assert.notEqual("ERR_ASSERTION", parseExc.code);
        debug(`parse Exception: ${JSON.stringify(parseExc)}`);
        debug(`parse Exception: ${parseExc.stack}`);
        assert.equal("exception", expected);
        return;
      }

      expect(expected).to.deep.equal(ast);
    });
  };

  testAst("validJson == true", {
    action: "equivalence",
    args: [
      {
        action: "substitution",
        args: [{ type: "variable", value: "validJson" }],
      },
      {
        action: "substitution",
        args: [{ type: "constant", value: true, varName: "validJson" }],
      },
    ],
  });

  testAst("notValidJson == true", {
    action: "equivalence",
    args: [
      {
        action: "substitution",
        args: [{ type: "variable", value: "notValidJson" }],
      },
      {
        action: "substitution",
        args: [{ type: "constant", value: true, varName: "notValidJson" }],
      },
    ],
  });
});
