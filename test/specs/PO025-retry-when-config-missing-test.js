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
  cp = require("node:child_process"),
  path = require("node:path"),
  testID = "PO025",
  Bundle = require("../../lib/package/Bundle.js"),
  debug = require("debug")("apigeelint:PO025-retry-test"),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${testID} - esLint retry tests`, function () {
  it("should retry with default config and cache it", function () {
    const originalSpawnSync = cp.spawnSync;
    let calls = [];

    // intercept spawnSync
    cp.spawnSync = (cmd, args, opts) => {
      // meter the calls to eslint
      if (cmd.includes("eslint.js")) {
        debug("calling spawnSync on eslint.js");
        calls.push(args);
      }
      return originalSpawnSync(cmd, args, opts);
    };

    try {
      const config = {
        debug: false,
        source: {
          type: "filesystem",
          path: path.resolve(
            __dirname,
            "../fixtures/resources/PO025/retry/apiproxy",
          ),
          bundleType: "apiproxy",
        },
        excluded: {},
      };
      let bundle = new Bundle(config);
      bl.executePlugin(testID, bundle);

      // BN013/bundle1/apiproxy has 4 JS files: sourceFile1.js, sourceFile2.js, sourceFile3.js, URI.js
      // First resource: fail + retry = 2 calls
      // Other 3 resources: 1 call each (cached) = 3 calls
      // Total = 5 calls
      assert.strictEqual(
        calls.length,
        5,
        "Should have 5 calls total (2 for first resource, 1 each for remaining 3)",
      );

      const retryCall = calls[1];
      assert.ok(retryCall.includes("-c"), "Second call should include -c");

      // Verify subsequent calls also used -c
      assert.ok(calls[2].includes("-c"), "Third call should include -c");
      assert.ok(calls[3].includes("-c"), "Fourth call should include -c");
      assert.ok(calls[4].includes("-c"), "Fifth call should include -c");
    } finally {
      cp.spawnSync = originalSpawnSync;
    }
  });

  it("should NOT retry when eslintRetry is false", function () {
    const originalSpawnSync = cp.spawnSync;
    let calls = [];

    // intercept spawnSync
    cp.spawnSync = (cmd, args, opts) => {
      // meter the calls to eslint
      if (cmd.includes("eslint.js")) {
        debug("calling spawnSync on eslint.js");
        calls.push(args);
      }
      return originalSpawnSync(cmd, args, opts);
    };

    try {
      const config = {
        debug: false,
        source: {
          type: "filesystem",
          path: path.resolve(
            __dirname,
            "../fixtures/resources/PO025/retry/apiproxy",
          ),
          bundleType: "apiproxy",
        },
        excluded: {},
        eslintNoRetry: true, // Disabling retry
      };
      let bundle = new Bundle(config);
      bl.executePlugin(testID, bundle);

      // BN013/bundle1/apiproxy has 4 JS files.
      // With retry disabled, each should have exactly 1 call.
      assert.strictEqual(
        calls.length,
        4,
        "Should have exactly 4 calls total (1 for each resource, no retries)",
      );

      calls.forEach((args, index) => {
        assert.ok(!args.includes("-c"), `Call ${index} should NOT include -c`);
      });
    } finally {
      cp.spawnSync = originalSpawnSync;
    }
  });
});
