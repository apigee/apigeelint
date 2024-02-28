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

const testID = "CC007",
  assert = require("assert"),
  xpath = require("xpath"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  debug = require("debug")("apigeelint:" + testID),
  Dom = require("@xmldom/xmldom").DOMParser,
  Condition = require("../../lib/package/Condition.js");

const escapeXml = (unsafe) =>
  unsafe.replace(/[<>&]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
    }
    return c;
  });

describe(`${testID} - ${plugin.plugin.name}`, function () {
  const cases = [
    { expression: "false", expectError: false },
    { expression: "true or false", expectError: false },
    {
      expression: "true of false",
      expectError: true,
      note: "misspelled operator"
    },
    {
      expression: "proxy.pathsuffix MatchesLike false",
      expectError: true,
      note: "unknown operator"
    },
    {
      expression: 'proxy.pathsuffix MatchesPath "/foo/bar"',
      expectError: false
    },
    {
      expression: 'proxy.pathsuffix ~/ "/foo/bar"',
      expectError: false
    },
    { expression: "A > 20", expectError: false },
    { expression: 'A = "c"', expectError: false },
    { expression: "A = 34", expectError: false },
    {
      expression: 'A > "c"',
      expectError: true,
      notes: "non-numeric on RHS of GT"
    },
    {
      expression: 'A >= "c"',
      expectError: true,
      notes: "non-numeric on RHS of GTE"
    },
    {
      expression: 'A <= "something"',
      expectError: true,
      notes: "non-numeric on RHS of LTE"
    },
    {
      expression: '"something" = "something"',
      expectError: true,
      notes: "non-token on LHS of operator"
    },
    {
      expression: '20 = "another-string"',
      expectError: true,
      notes: "non-token on LHS of operator"
    },
    {
      expression: "20 = 42",
      expectError: true,
      notes: "non-token on LHS of operator"
    },
    {
      expression:
        'request.header.content-type = "application/json" AND request.verb = "GET"',
      expectError: false
    },

    {
      expression:
        'not(request.header.content-type = "application/json")AND(request.verb = "GET")',
      expectError: false
    },
    {
      expression: '(true)AND(request.verb = "GET")',
      expectError: false
    },
    {
      expression: '(true) AND(request.verb = "GET")',
      expectError: false
    },
    {
      expression: '( true ) AND( request.verb = "GET" )',
      expectError: false
    },
    {
      expression: '( true )AND( request.verb = "GET" )',
      expectError: false
    },
    {
      expression: '(true )AND(request.verb = "GET")',
      expectError: false
    },
    {
      expression: '(true ) AND(request.verb = "GET")',
      expectError: false
    },
    {
      expression: '(true ) AND( request.verb = "GET" )',
      expectError: false
    },

    /* The following four cases differ only in spacing */
    {
      expression:
        '((a MatchesPath "/b/d") or (b MatchesPath "/c/d/e")) and (request.verb = "GET")',
      expectError: false
    },
    {
      expression:
        '((a MatchesPath "/b/d") or (b MatchesPath "/c/d/e"))and (request.verb = "GET")',
      expectError: false
    },
    {
      expression:
        '((a MatchesPath "/b/d") or (b MatchesPath "/c/d/e") )and (request.verb = "GET") ',
      expectError: false
    },
    {
      expression:
        '( ( a MatchesPath "/b/d") or (b MatchesPath "/c/d/e") )and (request.verb = "GET")',
      expectError: false
    }
  ];
  cases.forEach((testcase, i) => {
    it(`case ${i}, [${testcase.expression}], expect(${
      testcase.expectError ? "invalid" : "valid"
    })`, function () {
      const rootElement = new Dom().parseFromString(
        `<Hello><Condition>${escapeXml(
          testcase.expression
        )}</Condition></Hello>`
      );
      const cond = xpath.select("/Hello/Condition", rootElement);
      const c = new Condition(cond[0], rootElement);
      c.addMessage = function (msg) {
        debug(msg);
      };
      plugin.onCondition(c, function (e, flagged) {
        assert.equal(e, undefined);
        assert.equal(
          flagged,
          testcase.expectError,
          flagged ? " warning created " : "no warning created"
        );
      });
    });
  });
});
