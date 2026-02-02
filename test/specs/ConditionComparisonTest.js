/*
  Copyright © 2019-2026 Google LLC

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
const conditionComparison = require("../../lib/package/plugins/_conditionComparison.js");
const expect = require("chai").expect;

describe("ConditionComparison", function () {

  describe("Canonicalization", function () {
    const testcases = [
      [`request.verb="GET"`, `Equals(request.verb,'GET')`],
      [`(request.header.foo = "Bar")`, `Equals(request.header.FOO,'Bar')`],
      [
        `NOT(request.header.foo = "Bar")`,
        `NOT(Equals(request.header.FOO,'Bar'))`,
      ],
      [
        `(request.header.foo = "Foo") or (request.header.foo = "Bar")`,
        `OR(Equals(request.header.FOO,'Bar'),Equals(request.header.FOO,'Foo'))`,
      ],
      [
        `NOT(variable1 = "Foo" or variable2 = "Bar")`,
        `AND(NOT(Equals(variable1,'Foo')),NOT(Equals(variable2,'Bar')))`,
      ],
      [
        `proxy.pathsuffix ~/ "/r3" and request.verb = "GET" and request.header.foo = "Bar"`,

        `AND(Equals(request.header.FOO,'Bar'),Equals(request.verb,'GET'),MatchesPath(proxy.pathsuffix,'/r3'))`,
      ],
      [
        `proxy.pathsuffix ~/ "/r3" and request.header.foo = "Bar" and request.verb = "GET" `,

        `AND(Equals(request.header.FOO,'Bar'),Equals(request.verb,'GET'),MatchesPath(proxy.pathsuffix,'/r3'))`,
      ],

      [`request.header.foo = "bar"`, "Equals(request.header.FOO,'bar')"],
      [`response.header.via ~~ "bar"`, "JavaRegex(response.header.VIA,'bar')"],
      [
        `request.header.x-apikey StartsWith "bar"`,
        "StartsWith(request.header.X-APIKEY,'bar')",
      ],
    ];

    testcases.forEach((testcase, ix) => {
      it(`canonicalizes [${testcase[0]}] to [${testcase[1]}]`, function () {
        const expr = parser.parse(testcase[0].trim());
        const canonical = conditionComparison.canonicalize(expr);
        expect(canonical.signature).to.equal(testcase[1], `case ${ix}`);
      });
    });
  });

  describe("Comparison", function () {
    const testcases = [
      [`request.verb="GET"`, `request.verb = "GET"`, true],
      [`request.verb="GET"`, `request.verb = "POST"`, false],
      [
        `proxy.pathsuffix ~/ "/r2" and request.verb = "GET"`,
        `(request.verb = "GET") AND (proxy.pathsuffix ~/ "/r2")`,
        true,
      ],
      [
        `proxy.pathsuffix ~/ "/r3" and request.verb = "GET" and request.header.foo = "Bar"`,
        `(request.header.foo = "Bar") AND (request.verb = "GET") AND (proxy.pathsuffix ~/ "/r3")`,
        true,
      ],

      [
        `NOT(request.header.FOO = "Foo" or request.header.Foo = "Bar")`,
        `NOT(request.header.foo = "Bar" or request.header.foo = "Foo")`,
        true,
      ],

      [
        `NOT(request.header.foo = "Foo" or request.header.bar = "Bar")`,
        `NOT(request.header.foo = "Bar" or request.header.bar = "Foo")`,
        false,
      ],
      [`request.header.foo="bar"`, `request.header.FOO = "bar"`, true],
    ];

    testcases.forEach((testcase) => {
      it(`treats [${testcase[0]}] and [${testcase[1]}] expressions as ${testcase[2] ? "" : "NOT "}equivalent`, function () {
        const expr1 = parser.parse(testcase[0]);
        const expr2 = parser.parse(testcase[1]);
        const expected = testcase[2];
        expect(conditionComparison.equivalent(expr1, expr2)).to.equal(expected);
      });
    });
  });
});
