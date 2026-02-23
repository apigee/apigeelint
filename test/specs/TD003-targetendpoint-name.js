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

const ruleId = "TD003",
  assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - targetEndpoint name attr`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/TD003-TargetEndpoint-name/apiproxy"
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

      const t1Items = actualIssues.filter((e) =>
        e.filePath.endsWith("target-1.xml")
      );
      assert.ok(t1Items);
      assert.equal(t1Items.length, 0);

      const t2Items = actualIssues.filter((e) =>
        e.filePath.endsWith("target-2.xml")
      );
      assert.ok(t2Items);
      assert.equal(t2Items.length, 1);

      debug(util.format(t2Items[0].messages));
      let td003Messages = t2Items[0].messages.filter((m) => m.ruleId == ruleId);
      assert.equal(td003Messages.length, 1);
      assert.ok(td003Messages[0].message);
      assert.equal(
        td003Messages[0].message,
        "File basename (target-2) does not match endpoint name (wrongname)."
      );

      const t3Items = actualIssues.filter((e) =>
        e.filePath.endsWith("target-3.xml")
      );
      assert.ok(t3Items);
      assert.equal(t3Items.length, 1);

      td003Messages = t3Items[0].messages.filter((m) => m.ruleId == ruleId);
      assert.equal(td003Messages.length, 1);
      assert.ok(td003Messages[0].message);
      assert.equal(
        td003Messages[0].message,
        "TargetEndpoint has no name attribute."
      );
    });
  });
});
