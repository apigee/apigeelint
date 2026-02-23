/*
Copyright © 2019-2024,2026 Google LLC

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

const ruleId = "CC008",
  assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - bundle with conditional flows`, () => {
  function check(endpointName, expected) {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(__dirname, "../fixtures/resources/CC008/apiproxy"),
        bundleType: "apiproxy",
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length,
      );
      assert.ok(actualErrors.length);
      debug(util.format(actualErrors));

      const ep = actualErrors.find((e) => e.filePath.endsWith(endpointName));
      assert.ok(ep);
      let cc008Messages = ep.messages.filter((m) => m.ruleId == ruleId);
      assert.equal(cc008Messages.length, expected.length);

      expected.forEach((item, ix) => {
        assert.equal(cc008Messages[ix].line, item.line, `case(${ix}) line`);
        assert.equal(
          cc008Messages[ix].column,
          item.column,
          `case(${ix}) column`,
        );
        assert.equal(cc008Messages[ix].severity, 2, `case(${ix}) severity`);
        assert.ok(
          cc008Messages[ix].message.match(item.msgRe),
          `case(${ix}) message`,
        );
      });
    });
  }

  const re1 = new RegExp(
      "Logically equivalent conditions, (Flows|FaultRules|RouteRules) ([a-zA-Z][-a-zA-Z0-9]*) and ([a-zA-Z][-a-zA-Z0-9]*)",
    ),
    re2 = new RegExp(
      "Duplicate name on (Conditional Flows|FaultRules|RouteRules): ([a-zA-Z][-a-zA-Z0-9]*) \\(see previous.+\\)\\.",
    );

  it("should find equivalent conditions in a proxy endpoint", () => {
    let expected = [
      {
        line: 24,
        column: 5,
        msgRe: re1,
      },
      {
        line: 34,
        column: 5,
        msgRe: re1,
      },
      {
        line: 55,
        column: 5,
        msgRe: re1,
      },
      {
        line: 78,
        column: 5,
        msgRe: re1,
      },
    ];
    check("endpoint1.xml", expected);
  });

  it("should find duplicate names on flows", () => {
    let expected = [
      {
        line: 25,
        column: 5,
        msgRe: re2,
      },
    ];
    check("endpoint2.xml", expected);
  });

  it("should find equivalent conditions in faultrules", () => {
    let expected = [
      {
        line: 22,
        column: 5,
        msgRe: re1,
      },
    ];
    check("endpoint3.xml", expected);
  });

  it("should find duplicate names on FaultRules", () => {
    let expected = [
      {
        line: 22,
        column: 5,
        msgRe: re2,
      },
    ];
    check("endpoint4.xml", expected);
  });

  it("should find equivalent conditions on RouteRules", () => {
    let expected = [
      {
        line: 49,
        column: 3,
        msgRe: re1,
      },
    ];
    check("endpoint5.xml", expected);
  });

  it("should find duplicate names on RouteRules", () => {
    let expected = [
      {
        line: 50,
        column: 3,
        msgRe: re2,
      },
    ];
    check("endpoint6.xml", expected);
  });
});
