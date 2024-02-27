/*
  Copyright 2019-2024 Google LLC

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
  describe("Spacing", function () {
    const testcases = [
      [`request.verb="GET"`, `request.verb = "GET"`, "Equals"],
      [`request.verb=="GET"`, `request.verb == "GET"`, "Equals"],
      [`request.verb=="GET"`, `request.verb =="GET"`, "Equals"],
      [`request.verb!="GET"`, `request.verb != "GET"`, "NotEquals"],
      [`request.verb!="GET"`, `request.verb!= "GET"`, "NotEquals"],
      ["A>250", "A > 250", "GreaterThan"],
      ["A<250", "A < 250", "LesserThan"],
      ["A>=250", "A >= 250", "GreaterThanOrEquals"],
      ["A<=250", "A <= 250", "LesserThanOrEquals"],
      [`A:="seven"`, `A := "seven"`, "EqualsCaseInsensitive"],
      [`A=|"seven"`, `A =| "seven"`, "StartsWith"],
      [`A~"seven"`, `A ~ "seven"`, "Matches"],
      [`A~~"^foo(a|b)$"`, `A ~~ "^foo(a|b)$"`, "JavaRegex"],
      [`proxy.pathsuffix~/"/a/b"`, `proxy.pathsuffix ~/ "/a/b"`, "MatchesPath"]
    ];

    testcases.forEach((testcase) => {
      it(`treats [${testcase[0]}] and [${testcase[1]}] expressions as equivalent`, function () {
        const result1 = parser.parse(testcase[0]);
        const result2 = parser.parse(testcase[1]);
        expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
        expect(result1.operator).to.equal(testcase[2]);
      });
    });
  });

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
      const result1 = parser.parse(c1);
      const json1 = JSON.stringify(result1);
      expect(json1).to.equal('{"operator":"NOT","operands":["valid"]}');
      const c2 = "!(valid)";
      const result2 = parser.parse(c2);
      expect(json1).to.equal(JSON.stringify(result2));
      const c3 = "not valid";
      const result3 = parser.parse(c3);
      expect(json1).to.equal(JSON.stringify(result3));
    });

    it("treats NOT as case-insensitive", function () {
      const c1 = "!(valid)";
      const result1 = parser.parse(c1);
      const json1 = JSON.stringify(result1);
      expect(json1).to.equal('{"operator":"NOT","operands":["valid"]}');
      const synonyms = ["not(valid)", "Not(valid)", "nOT(valid)"];
      for (let i = 0; i < synonyms.length; i++) {
        const c2 = synonyms[i];
        const result2 = parser.parse(c2);
        expect(json1).to.equal(JSON.stringify(result2));
      }
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

    it("treats AND as case-insensitive", function () {
      const c1 = '(proxy.pathsuffix ~ "/authorize") && (request.verb = "POST")';
      const result1 = parser.parse(c1);
      const json1 = JSON.stringify(result1);
      const variants = ["And", "AND", "and", "aNd", "anD", "ANd", "aND"];
      for (let i = 0; i < variants.length; i++) {
        const c2 = c1.replace("&&", variants[i]);
        const result2 = parser.parse(c2);
        expect(json1).to.equal(JSON.stringify(result2));
      }
    });
  });

  describe("Invalid Operators", function () {
    it("treats = and == as synonyms", function () {
      const c1 = `request.formparam.grant_type == "authorization_code"`;
      const result1 = parser.parse(c1);
      const c2 = c1.replace("==", "=");
      const result2 = parser.parse(c2);
      expect(JSON.stringify(result1)).to.equal(JSON.stringify(result2));
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

    const validOperators = ["equals", "notequals", "isnot", "is"];
    validOperators.forEach((goodOp) => {
      const expr = (op) =>
        `request.formparam.grant_type ${op} "authorization_code"`;
      it(`accepts ${goodOp} as an operator`, function () {
        const c1 = expr(goodOp);
        try {
          parser.parse(c1);
          expect(true);
        } catch (_e) {
          expect.fail();
        }
      });
      const badOp = `${goodOp}a`;
      it(`rejects ${badOp} as an operator`, function () {
        const c1 = expr(badOp);
        try {
          parser.parse(c1);
          expect.fail();
        } catch (e) {
          expect(e.toString()).to.include("SyntaxError");
        }
      });
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

    it("treats OR as case-insensitive", function () {
      const c1 = '(proxy.pathsuffix ~ "/authorize") || (request.verb = "POST")';
      const result1 = parser.parse(c1);
      const json1 = JSON.stringify(result1);
      const variants = ["Or", "or", "oR", "OR"];
      for (let i = 0; i < variants.length; i++) {
        const c2 = c1.replace("||", variants[i]);
        const result2 = parser.parse(c2);
        expect(json1).to.equal(JSON.stringify(result2));
      }
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
        expect(e.toString()).to.include("Expected ");
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

    const operators_accept_symbol = [
      "Equals",
      "NotEquals",
      "LesserThan",
      "GreaterThan",
      "LesserThanOrEquals",
      "GreaterThanOrEquals",
      "StartsWith"
    ];
    operators_accept_symbol.forEach((op) => {
      it(`allows variable on RHS of ${op}`, function () {
        const c1 = `request.formparam.grant_type ${op} symbol_name`;
        try {
          parser.parse(c1);
          expect(true);
        } catch (e) {
          console.log(e);
          expect.fail();
        }
      });
    });

    const operators_do_not_accept_symbol = [
      "EqualsCaseInsensitive",
      "JavaRegex",
      "Matches",
      "MatchesPath"
    ];
    operators_do_not_accept_symbol.forEach((op) => {
      it(`allows variable on RHS of ${op}`, function () {
        const c1 = `request.formparam.grant_type ${op} symbol_name`;
        try {
          parser.parse(c1);
          expect.fail();
        } catch (e) {
          expect(e.toString()).to.include("SyntaxError");
        }
      });
    });

    it("flags a missing close paren", function () {
      const c1 = `(request.formparam.grant_type = "authorization_code"`;
      try {
        parser.parse(c1);
        expect.fail();
      } catch (e) {
        expect(e.toString()).to.include("SyntaxError");
        expect(e.toString()).to.include("Expected ");
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

  describe("Operators", function () {
    const cases = [
      {
        expression: 'A := "valid"',
        longFormOperator: "EqualsCaseInsensitive"
      },
      { expression: 'A = "valid"', longFormOperator: "Equals" },
      { expression: 'A == "valid"', longFormOperator: "Equals" },
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

    const randomizeCapitalization = (s) =>
      s
        .toLowerCase()
        .split("")
        .map((c) => (Math.random() < 0.5 ? c : c.toUpperCase()))
        .join("");

    const cases2 = [
      'A EqualsCaseInsensitive "valid"',
      'A Equals "valid"',
      'A NotEquals "valid"',
      'A JavaRegex "foobar[a-z]+"',
      'A MatchesPath "/foo/bar"',
      'A StartsWith "something"',
      "A GreaterThanOrEquals 20",
      "A GreaterThan 20",
      "A LesserThanOrEquals 20",
      "A LesserThan 20"
    ];

    cases2.forEach((expression) => {
      it(`verifies that ${
        expression.split(" ")[1]
      } is treated case insensitively`, function () {
        try {
          const result1 = parser.parse(expression);
          const json1 = JSON.stringify(result1);
          const parts = expression.split(" ");
          for (let i = 0; i < 3; i++) {
            const expression2 = [
              parts[0],
              randomizeCapitalization(parts[1]),
              parts[2]
            ].join(" ");
            const result2 = parser.parse(expression2);
            expect(json1).to.equal(JSON.stringify(result2));
          }
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
