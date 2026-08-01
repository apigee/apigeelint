/*
  Copyright © 2026 Google LLC

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

const assert = require("node:assert"),
  path = require("node:path"),
  testID = "BN015",
  debug = require("debug")("apigeelint:" + testID),
  bl = require("../../lib/package/bundleLinter.js");

describe("BN015 - Check manifest file exists", function () {
  it("should flag a bundle that is missing the manifest .xml file", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/missingManifest/apiproxy",
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
      const bn015Messages = items[0].messages.filter(
        (m) => m.ruleId == testID,
      );
      assert.equal(bn015Messages.length, 1);
      assert.equal(bn015Messages[0].severity, 2);
      debug(`bn015Messages: ${JSON.stringify(bn015Messages)}`);
    });
  });

  it("should not flag a bundle that has a manifest .xml file", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/sampleProxy/24Solver/apiproxy",
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
      const bn015Messages = items[0].messages.filter(
        (m) => m.ruleId == testID,
      );
      assert.equal(bn015Messages.length, 0);
    });
  });
});
