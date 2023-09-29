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

const ruleId = "BN011",
  assert = require("assert"),
  path = require("path"),
  util = require("util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`BN011 - bundle with malformed XML`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/BN011-well-formed-xml/apiproxy",
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
      const pluginIssues = items.filter(
        (item) =>
          item.messages &&
          item.messages.length &&
          item.messages.find((m) => m.ruleId == ruleId),
      );
      assert.equal(pluginIssues.length, 1);
      assert.ok(pluginIssues[0].messages);
      assert.ok(pluginIssues[0].messages[0]);
      assert.ok(pluginIssues[0].messages[0].message);
      assert.ok(
        pluginIssues[0].messages[0].message.startsWith(
          "Configuration for proxy endpoint endpoint1 is not well-formed XML",
        ),
      );
      assert.equal(pluginIssues[0].messages[0].column, 5);
      assert.equal(pluginIssues[0].messages[0].line, 18);
    });
  });
});
