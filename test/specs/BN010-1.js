/*
Copyright 2019-2022,2025 Google LLC

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
  testID = "BN010",
  bl = require("../../lib/package/bundleLinter.js");

describe(`${testID} - bundle with reference to missing policy`, () => {
  it("should generate the expected error", () => {
    let configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/BN010-missing-policy/apiproxy",
        ),
        bundleType: "apiproxy",
      },
      profile: "apigee",
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      let actualErrors = items.filter(
        (item) =>
          item.messages &&
          item.messages.length &&
          item.messages.find((m) => m.ruleId == testID),
      );
      assert.equal(actualErrors.length, 1);
      assert.ok(actualErrors[0].messages.length);
      const diags = JSON.stringify(actualErrors[0].messages);
      const bn010Messages = actualErrors[0].messages.filter(
        (m) => m.ruleId == testID,
      );

      assert.equal(bn010Messages.length, 1, diags);
      assert.ok(bn010Messages[0].message, diags);
      assert.equal(
        bn010Messages[0].message,
        'Missing policy "AM-Response-1"',
        bn010Messages[0].message,
      );
    });
  });
});
