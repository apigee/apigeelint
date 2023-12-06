/*
  Copyright 2019-2023 Google LLC

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

const parser = require("../../build/ConditionParser.js");
const expect = require("chai").expect;
//const debug = require("debug")(`apigeelint:ConditionParser`);

describe("ConditionParser", function () {
  describe("Parens", function () {
    it("treats parenthesized and non-parenthesized atoms as equivalent", function () {
      const c1 = "valid";
      const c2 = "(valid)";
      const result1 = parser.parse(c1);
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
      expect(JSON.stringify(result1)).to.equal('"valid"');
    });
    it("treats parenthesized and non-parenthesized boolean expressions as equivalent", function () {
      const c1 = 'request.verb = "POST"';
      const c2 = '(request.verb = "POST")';
      const result1 = parser.parse(c1);
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
      expect(JSON.stringify(result1)).to.equal(
        '{"operator":"Equals","operands":["request.verb","\'POST\'"]}'
      );
    });
  });

  describe("AND statement with MatchesPath verb", function () {
    const c1 =
      '(proxy.pathsuffix MatchesPath "/auth") and (request.verb = "POST")';
    const c2 = '(proxy.pathsuffix ~/ "/auth") and (request.verb = "POST")';
    it("parses long and short form of MatchesPath the same", function () {
      const result1 = parser.parse(c1);
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
    });
  });

  describe("NOT statements", function () {
    it("parses negation of token", function () {
      const c1 = "!valid";
      const result1 = parser.parse(c1);
      expect(JSON.stringify(result1)).to.equal(
        '{"operator":"NOT","operands":["valid"]}'
      );
    });

    it("parses negation of parenthesized expression", function () {
      const c1 = "!(valid)";
      const result1 = parser.parse(c1);
      expect(JSON.stringify(result1)).to.equal(
        '{"operator":"NOT","operands":["valid"]}'
      );
    });

    it("treats parenthesized and non-parenthesized atoms as equivalent", function () {
      const c1 = "!valid";
      const c2 = "!(valid)";
      const result1 = parser.parse(c1);
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
      expect(JSON.stringify(result1)).to.equal(
        '{"operator":"NOT","operands":["valid"]}'
      );
    });

    it("parses negation of parenthesized compound expression", function () {
      const c1 = '!((seven = "5") AND (valid = false))';
      const expected =
        '{"operator":"NOT","operands":[{"operator":"AND","operands":[{"operator":"Equals","operands":["seven","\'5\'"]},{"operator":"Equals","operands":["valid",false]}]}]}';
      const result1 = parser.parse(c1);
      expect(JSON.stringify(result1)).to.equal(expected);
    });
  });

  describe("AND statements", function () {
    it("treats AND and && as synonyms", function () {
      const c1 =
        '(proxy.pathsuffix ~ "/authorize") and (request.verb = "POST")';
      const result1 = parser.parse(c1);
      const c2 = c1.replace("and", "&&");
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
    });

    it("parses AND statements with 3 clauses", function () {
      const c1 = `(proxy.pathsuffix MatchesPath "/token") and
   (request.verb = "POST") and
   (request.formparam.grant_type = "authorization_code")`;
      const result = parser.parse(c1);
      // {
      //   "operator": "AND",
      //   "operands": [
      //     {
      //       "operator": "MatchesPath",
      //       "operands": [
      //         "proxy.pathsuffix",
      //         "'/token'"
      //       ]
      //     },
      //     {
      //       "operator": "AND",
      //       "operands": [
      //         {
      //           "operator": "Equals",
      //           "operands": [
      //             "request.verb",
      //             "'POST'"
      //           ]
      //         },
      //         {
      //           "operator": "Equals",
      //           "operands": [
      //             "request.formparam.grant_type",
      //             "'authorization_code'"
      //           ]
      //         }
      //       ]
      //     }
      //   ]
      // }
      expect(result.operator).to.equal("AND");
      expect(result.operands.length).to.equal(2);
      expect(result.operands[0].operator).to.equal("MatchesPath");
      expect(result.operands[1].operator).to.equal("AND");
      expect(result.operands[1].operands[0].operator).to.equal("Equals");
      expect(result.operands[1].operands[1].operator).to.equal("Equals");
    });

    it("parses AND statements with 3 clauses, no parens, and newlines", function () {
      const c1 = `proxy.pathsuffix MatchesPath "/token" and
   request.verb = "POST" and
   request.formparam.grant_type = "authorization_code"`;
      const result = parser.parse(c1);
      expect(result.operator).to.equal("AND");
      expect(result.operands.length).to.equal(2);
      expect(result.operands[0].operator).to.equal("MatchesPath");
      expect(result.operands[1].operator).to.equal("AND");
      expect(result.operands[1].operands[0].operator).to.equal("Equals");
      expect(result.operands[1].operands[1].operator).to.equal("Equals");
    });
  });

  describe("Invalid Operators", function () {
    it("rejects double equals as an operator", function () {
      const c1 = `request.formparam.grant_type == "authorization_code"`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
        expect(e.toString()).to.include('but "="');
      }
      try {
        parser.parse(c1.replace("==", "="));
        // no error
        expect(true);
      } catch (e) {
        expect.fail();
      }
    });

    it("rejects SeemsLike as an operator", function () {
      const c1 = `request.formparam.grant_type SeemsLike "authorization_code"`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
    });
  });

  describe("OR statements", function () {
    it("treats OR and || as synonyms", function () {
      const c1 = '(request.verb = "PUT") or (request.verb = "POST")';
      const result1 = parser.parse(c1);
      const c2 = c1.replace("or", "||");
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
    });
  });

  describe("implicit parens", function () {
    it("successfully parses compound statements with no parens", function () {
      const c1 = 'proxy.pathsuffix ~ "/authorize" and request.verb = "POST"';
      const result1 = parser.parse(c1);
    });

    it("successfully parses implicit parens-2", function () {
      const c1 = '(proxy.pathsuffix ~ "/authorize") and request.verb = "POST"';
      parser.parse(c1); // no exception
      // TODO: add some expects here
    });

    it("correctly parses compound statements with no parens", function () {
      const c1 = 'proxy.pathsuffix ~ "/authorize" and request.verb = "POST"';
      const c2 =
        '(proxy.pathsuffix ~ "/authorize") and (request.verb = "POST")';
      const result1 = parser.parse(c1);
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
    });

    it("correctly parses compound statements with no parens-2", function () {
      const c1 = 'proxy.pathsuffix ~ "/authorize" and request.verb = "POST"';
      const c2 = 'proxy.pathsuffix ~ "/authorize" and (request.verb = "POST")';
      const result1 = parser.parse(c1);
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
    });

    it("correctly parses negated compound statements with no parens", function () {
      const c1 = '!((seven = "5") AND (valid = false))';
      const c2 = '!(seven = "5" AND valid = false)';
      const result1 = parser.parse(c1);
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
    });
  });

  describe("Invalid Syntax", function () {
    it("rejects curly braces in place of parens", function () {
      const c1 = '{seven = "5"} AND {valid = false}';
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
    });

    it("rejects curly braces on RHS", function () {
      const c1 = "variable-name = {5}";
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
    });

    it("rejects a missing double-quote", function () {
      const c1 = `request.formparam.grant_type = "authorization_code`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
        expect(e.toString()).to.include('Expected "\\""');
      }
      try {
        parser.parse(c1 + '"');
        // no error
        expect(true);
      } catch (_e) {
        expect.fail();
      }
    });

    it("rejects too many double-quotes", function () {
      const c1 = `request.formparam.grant_type = "authorization_code""`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
        expect(e.toString()).to.include("Expected [ \\t\\n] or end");
      }
      try {
        parser.parse(c1.slice(0, -1));
        // no error
        expect(true);
      } catch (_e) {
        expect.fail();
      }
    });

    it("rejects single-quotes", function () {
      const c1 = `request.formparam.grant_type = 'authorization_code'`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
      try {
        parser.parse(c1.replaceAll("'", '"'));
        // no error
        expect(true);
      } catch (_e) {
        expect.fail();
      }
    });

    it("rejects a single single-quote", function () {
      const c1 = `request.formparam.grant_type = 'authorization_code`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
      try {
        parser.parse(c1.replaceAll("'", '"') + '"');
        // no error
        expect(true);
      } catch (_e) {
        expect.fail();
      }
    });

    it("rejects symbol on RHS of equals", function () {
      const c1 = `request.formparam.grant_type = authorization_code`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
        expect(e.toString()).to.include('Expected "-"');
      }
      try {
        const result = parser.parse(
          c1.replace("authorization_code", '"authorization_code"')
        );
        // no error
        expect(result).to.not.be.null;
      } catch (_e) {
        expect.fail();
      }
    });

    it("flags a missing close paren", function () {
      const c1 = `(request.formparam.grant_type = "authorization_code"`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
        expect(e.toString()).to.include('Expected ")"');
      }
      try {
        const result = parser.parse(c1.replace('code"', 'code")'));
        // no error
        expect(result).to.not.be.null;
      } catch (_e) {
        expect.fail();
      }
    });

    it("flags a stray close paren", function () {
      const c1 = `request.formparam.grant_type = "authorization_code")`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
      try {
        const result = parser.parse(c1.slice(0, -1));
        // no error
        expect(result).to.not.be.null;
      } catch (_e) {
        expect.fail();
      }
    });

    it("rejects a missing operand", function () {
      const c1 = `request.formparam.grant_type = `;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
      try {
        const result = parser.parse(c1 + '"foo"');
        // no error
        expect(result).to.not.be.null;
      } catch (_e) {
        expect.fail();
      }
    });

    it("flags a missing clause after conjunction", function () {
      const c1 = `request.formparam.grant_type = "client_credentials" and `;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
      try {
        const result = parser.parse(c1 + "request.header.foo is null");
        // no error
        expect(result).to.not.be.null;
      } catch (_e) {
        expect.fail();
      }
    });

    it("flags a doubled conjunction", function () {
      const c1 = `request.formparam.grant_type = "client_credentials" and
                  and request.header.foo is null`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
      try {
        const result = parser.parse(c1.replace("and", ""));
        // no error
        expect(result).to.not.be.null;
      } catch (_e) {
        expect.fail();
      }
    });

    it("flags a quoted expression", function () {
      const c1 = `"request.formparam.grant_type is null"`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
      }
      try {
        const result = parser.parse(c1.replaceAll('"', ""));
        // no error
        expect(result).to.not.be.null;
      } catch (_e) {
        expect.fail();
      }
    });
  });

  describe("Operator translation", function () {
    const cases = [
      {
        expression: 'A := "valid"',
        longFormOperator: "EqualsCaseInsensitive"
      },
      { expression: 'A = "valid"', longFormOperator: "Equals" },
      { expression: 'A != "valid"', longFormOperator: "NotEquals" },
      { expression: 'A ~~ "foobar[a-z]+"', longFormOperator: "JavaRegex" },
      { expression: 'A ~/ "/foo/bar"', longFormOperator: "MatchesPath" },
      { expression: 'A =| "something"', longFormOperator: "StartsWith" },
      { expression: "A >= 20", longFormOperator: "GreaterThanOrEquals" },
      { expression: "A > 20", longFormOperator: "GreaterThan" },
      { expression: "A <= 20", longFormOperator: "LesserThanOrEquals" },
      { expression: "A < 20", longFormOperator: "LesserThan" }
    ];
    cases.forEach((testcase) => {
      it(`verifies that ${testcase.expression} is parsed as ${testcase.longFormOperator}`, function () {
        try {
          const result = parser.parse(testcase.expression);
          expect(result.operator).to.equal(testcase.longFormOperator);
        } catch (_e) {
          expect.fail(_e);
        }
      });
    });
  });

  describe("Mismatch between Operator and operand", function () {
    const cases = [
      { expression: 'A > "valid"' },
      { expression: "A ~~ 20" },
      { expression: "A ~/ 42" },
      { expression: "A =| 103" },
      { expression: 'A >= "something"' },
      { expression: 'A > "something"' },
      { expression: 'A <= "something"' },
      { expression: 'A < "something"' }
    ];
    cases.forEach((testcase) => {
      it(`verifies that ${testcase.expression} is rejected as invalid`, function () {
        try {
          const _result = parser.parse(testcase.expression);
          expect.fail();
        } catch (e) {
          expect(e.toString()).to.include("SyntaxError");
        }
      });
    });
  });

  describe("Parsing valid numerics", function () {
    const cases = [
      { expression: "A > 20" },
      { expression: "A > 20.1" },
      { expression: "A > 20.1392" },
      { expression: "A > -20.1392" },
      { expression: "A > -250" },
      { expression: "A >= 120.1392" },
      { expression: "A < 0.5" },
      { expression: "A < -0.5" }
    ];
    cases.forEach((testcase) => {
      it(`verifies that ${testcase.expression} is accepted as valid`, function () {
        try {
          const _result = parser.parse(testcase.expression);
          expect(true);
        } catch (_e) {
          console.log(_e);
          expect.fail();
        }
      });
    });
  });

  describe("Parsing invalid numerics", function () {
    const cases = [
      { expression: "A > 20.20.20" },
      { expression: "A > .20.1" },
      { expression: "A > ..201392" },
      { expression: "A > -20..1392" },
      { expression: "A > 20..1392" }
    ];
    cases.forEach((testcase) => {
      it(`verifies that ${testcase.expression} is rejected as invalid`, function () {
        try {
          const _result = parser.parse(testcase.expression);
          expect.fail();
        } catch (e) {
          expect(e.toString()).to.include("SyntaxError");
        }
      });
    });
  });

  describe("Non-variables on LHS", function () {
    const cases = [
      { expression: '"seventy-two" > 20' },
      { expression: '"a-string" = "another-string"' },
      { expression: '20 = "another-string"' },
      { expression: '20three = "another-string"' },
      { expression: "20 = 42" }
    ];
    cases.forEach((testcase) => {
      it(`verifies that ${testcase.expression} is rejected as invalid`, function () {
        try {
          const _result = parser.parse(testcase.expression);
          expect.fail();
        } catch (e) {
          expect(e.toString()).to.include("SyntaxError");
        }
      });
    });
  });
});
