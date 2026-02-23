/*
  Copyright 2019-2022,2024 Google LLC

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

const ruleId = "PD004",
  assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - proxyEndpoint name attr`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PD004-ProxyEndpoint-name/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualIssues = items.filter(
        (item) =>
          item.messages &&
          item.messages.length &&
          item.messages.find((m) => m.ruleId == ruleId)
      );

      assert.equal(actualIssues.length, 2);
      debug(util.format(actualIssues));

      const ep1Items = actualIssues.filter((e) =>
        e.filePath.endsWith("endpoint1.xml")
      );
      assert.ok(ep1Items);
      assert.equal(ep1Items.length, 1);
      debug(util.format(ep1Items[0].messages));
      let pd004Messages = ep1Items[0].messages.filter(
        (m) => m.ruleId == ruleId
      );
      assert.equal(pd004Messages.length, 1);
      assert.ok(pd004Messages[0].message);
      assert.equal(
        pd004Messages[0].message,
        "File basename (endpoint1) does not match endpoint name (default)."
      );

      const ep2Items = actualIssues.filter((e) =>
        e.filePath.endsWith("endpoint2.xml")
      );
      assert.ok(ep2Items);
      assert.equal(ep2Items.length, 1);
      debug(util.format(ep2Items[0].messages));
      pd004Messages = ep2Items[0].messages.filter((m) => m.ruleId == ruleId);
      assert.equal(pd004Messages.length, 1);
      assert.ok(pd004Messages[0].message);
      assert.equal(
        pd004Messages[0].message,
        "ProxyEndpoint has no name attribute."
      );
    });
  });
});
