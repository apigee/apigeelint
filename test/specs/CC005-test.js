/*
Copyright © 2019-2021,2025,2026 Google LLC

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

const testID = "CC005",
  assert = require("assert"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  debug = require("debug")(`apigeelint:${testID}-test`);

describe(`${testID} - malformed Conditions`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/CC005/proxy1/apiproxy",
        ),
        bundleType: "apiproxy",
      },
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const proxyEndpointItems = items.filter((m) =>
        m.filePath.endsWith("endpoint1.xml"),
      );
      assert.equal(proxyEndpointItems.length, 1);
      const cc005Messages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId == "CC005",
      );
      debug(`messages: ${JSON.stringify(cc005Messages, null, 2)}`);
      const expected = [
        {
          line: 29,
          column: 11,
          message: 'Possible unterminated string: ("OPTIONS)',
        },
        {
          line: 47,
          column: 7,
          message: `Invalid Condition - cannot parse (Unrecognized token 'GET"x29' at position 4. Expecting: LOGICAL_OPERATOR)`,
        },
        {
          line: 59,
          column: 7,
          message: `Invalid Condition - cannot parse (Unrecognized token 'GET"' at position 3. Expecting: LOGICAL_OPERATOR)`,
        },
      ];
      assert.equal(cc005Messages.length, expected.length);

      const otherMessages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId != "CC005",
      );
      debug(`other messages: ` + JSON.stringify(otherMessages, null, 2));
      expected.forEach((item, ix) => {
        Object.keys(item).forEach((key) => {
          assert.ok(cc005Messages[ix]);
          assert.ok(cc005Messages[ix][key]);
          assert.equal(
            cc005Messages[ix][key],
            item[key],
            `case(${ix}) key(${key})`,
          );
        });
      });
    });
  });

  it("should not hang", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/CC005/issue483/apiproxy",
        ),
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
      const proxyEndpointItems = items.filter((m) =>
        m.filePath.endsWith("endpoint1.xml"),
      );
      assert.equal(proxyEndpointItems.length, 1);
      const cc005Messages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId == "CC005",
      );
      assert.equal(cc005Messages.length, 0);

      const otherMessages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId != "CC005",
      );
      debug(`other messages: ` + JSON.stringify(otherMessages, null, 2));
      assert.notEqual(otherMessages.length, 0);
    });
  });

  it("should correctly parse leading NOT with and without spaces", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/CC005/leading-not/apiproxy",
        ),
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
      const proxyEndpointItems = items.filter((m) =>
        m.filePath.endsWith("endpoint1.xml"),
      );
      assert.equal(proxyEndpointItems.length, 1);
      const cc005Messages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId == "CC005",
      );
      assert.equal(cc005Messages.length, 0);

      const otherMessages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId != "CC005",
      );
      debug(`other messages: ` + JSON.stringify(otherMessages, null, 2));
      assert.notEqual(otherMessages.length, 0);
    });
  });
});
