/*
  Copyright 2019-2025 Google LLC

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

const assert = require("node:assert"),
  path = require("node:path"),
  bl = require("../../lib/package/bundleLinter.js");

describe(`TD002 - Not an Edgemicro proxy`, () => {
  it("should generate Target Server warning", () => {
    let configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/TD002-edgemicro-not/apiproxy",
        ),
        bundleType: "apiproxy",
      },
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      items = items.filter(
        (item) =>
          item.messages &&
          item.messages.length &&
          item.filePath.endsWith(
            path.normalize("/apiproxy/targets/default.xml"),
          ),
      );

      assert.equal(items.length, 1);
      assert.equal(
        items[0].messages.filter((m) => m.ruleId == "TD002").length,
        1,
        JSON.stringify(items[0].messages),
      );
    });
  });
});
