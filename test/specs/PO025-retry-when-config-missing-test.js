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

const testID = "PO025",
  assert = require("node:assert"),
  cp = require("node:child_process"),
  fs = require("node:fs"),
  path = require("node:path"),
  Bundle = require("../../lib/package/Bundle.js"),
  debug = require("debug")("apigeelint:PO025-retry-test"),
  tmp = require("tmp"),
  { getAvailableDriveLetter } = require("../fixtures/filesystem-helpers.js"),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${testID} - esLint retry tests`, function () {
  this.timeout(12000);
  this.slow(8000);
  const fixtureDir = path.resolve(
    __dirname,
    "../fixtures/resources/PO025/retry",
  );

  let tmpDir;
  let driveLetter;
  let proxyParentDir;

  const spyOnSpawn = (calls) => {
    const originalSpawnSync = cp.spawnSync;
    cp.spawnSync = (cmd, args, opts) => {
      if (args[0].includes("eslint.js")) {
        debug("calling spawnSync on eslint.js");
        calls.push(args);
      }
      return originalSpawnSync(cmd, args, opts);
    };
    return () => (cp.spawnSync = originalSpawnSync);
  };

  const executePlugin = (overrides) => {
    const config = {
      debug: false,
      source: {
        type: "filesystem",
        path: path.resolve(proxyParentDir, "apiproxy"),
        bundleType: "apiproxy",
      },
      excluded: {},
      ...overrides,
    };
    const bundle = new Bundle(config);
    bl.executePlugin(testID, bundle);
  };

  before(function () {
    /*
     * Copy the proxy files so that when eslint searches for eslint.config.js,
     * it will not find the one in the apigeelint project root.
     **/
    tmpDir = tmp.dirSync({
      prefix: `apigeelint-eslint-retry-test`,
      keep: false,
      unsafeCleanup: true,
    });
    proxyParentDir = tmpDir.name;
    fs.cpSync(fixtureDir, tmpDir.name, { recursive: true, force: true });
    /*
     * On Windows, used by developers and also used by Azure DevOps, eg Github
     * Actions, a TEMP dir is under the user's home directory.  This means that
     * the eslint search-for-config may find a eslint.config.js file in the
     * user's home, which is undesired for the purposes of this test. To prevent
     * THAT, substitute a drive letter, and use THAT as the location of the
     * files to be scanned.
     **/
    if (process.platform == "win32") {
      driveLetter = getAvailableDriveLetter(debug);
      // console.log(`Mapping ${tmpDir.name} to ${driveLetter}:\\`);
      cp.execSync(`subst ${driveLetter}: "${tmpDir.name}"`);
      proxyParentDir = `${driveLetter}:\\`;
    }
  });

  after(function () {
    if (process.platform == "win32" && driveLetter) {
      try {
        cp.execSync(`subst ${driveLetter}: /D`);
      } catch (e) {
        console.error(`Failed to unmap drive ${driveLetter}:`, e.message);
      }
    }
    tmpDir.removeCallback();
  });

  it("should retry with default config and cache it", function () {
    const calls = [];
    const restoreSpawn = spyOnSpawn(calls);
    try {
      executePlugin();

      // PO025/retry/apiproxy has 4 JS files: sourceFile1.js, sourceFile2.js, sourceFile3.js, URI.js
      // First resource: fail + retry = 2 calls
      // Other 3 resources: 1 call each (cached) = 3 calls
      // Total = 5 calls
      assert.strictEqual(
        calls.length,
        5,
        "Should have 5 calls total (1 failed call for first resource, then 1 retry, then 1 each for the remaining 3)",
      );

      assert.ok(!calls[0].includes("-c"), `Call 0 should NOT include -c`);

      calls.slice(1).forEach((args, index) => {
        assert.ok(args.includes("-c"), `Call ${index} should include -c`);
      });
    } finally {
      restoreSpawn();
    }
  });

  it("should NOT retry when eslintRetry is false", function () {
    const calls = [];
    const restoreSpawn = spyOnSpawn(calls);
    try {
      executePlugin({ po025NoRetry: true });

      // PO025/retry/apiproxy has 4 JS files.
      // With retry disabled, each should have exactly 1 call. (With no
      // eslint.config.js, all calls will fail to run eslint!)
      assert.strictEqual(
        calls.length,
        4,
        "Should have exactly 4 calls total (1 for each resource, all failures, no retries)",
      );

      calls.forEach((args, index) => {
        assert.ok(!args.includes("-c"), `Call ${index} should NOT include -c`);
      });
    } finally {
      restoreSpawn();
    }
  });
});
