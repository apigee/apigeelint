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
  fs = require("node:fs"),
  path = require("node:path"),
  debug = require("debug")("apigeelint:npx-test"),
  { getAvailableDriveLetter } = require("../fixtures/filesystem-helpers.js"),
  tmp = require("tmp");

describe("NPX Integration Test", function () {
  this.timeout(68000);
  const proxyPath = path.resolve(
    __dirname,
    "../fixtures/resources/sample-proxy-with-issues/response-shaping/apiproxy",
  );

  let tarballPath;
  let tempDirObj;
  let driveLetter;
  let currentTempDir;

  before(() => {
    // 1. Create a truly isolated temp directory
    tempDirObj = tmp.dirSync({
      prefix: `apigeelint-npx-test-`,
      unsafeCleanup: true,
    });

    currentTempDir = tempDirObj.name;
    debug(`currentTempDir: ${currentTempDir}`);

    // 1a. use subst on windows to avoid contamination
    if (process.platform === "win32") {
      driveLetter = getAvailableDriveLetter(debug);
      cp.execSync(`subst ${driveLetter}: "${currentTempDir}"`);
      currentTempDir = `${driveLetter}:\\`;
    }

    // 2. Create a tarball of the current state
    // Use --pack-destination to keep the project root clean
    const packOutput = cp
      .execSync(`npm pack --quiet --pack-destination ${currentTempDir}`, {
        encoding: "utf8",
      })
      .trim();
    const lines = packOutput.split("\n");
    const tarballName = lines[lines.length - 1]; // Get the last line (the filename)
    tarballPath = path.resolve(currentTempDir, tarballName);

    if (debug.enabled) {
      const dirOutput = cp.execSync(`dir ${currentTempDir}`, {
        encoding: "utf8",
      });
      console.log(`dir ${currentTempDir}: ${dirOutput}`);
      console.log(`tarball: ${tarballPath}`);
    }
  });

  after(() => {
    // Clean up the tarball and the temp directory
    if (process.platform === "win32" && driveLetter) {
      try {
        cp.execSync(`subst ${driveLetter}: /D`);
      } catch (e) {
        console.error(`Failed to unmap drive ${driveLetter}:`, e.message);
      }
    }
    if (tarballPath && fs.existsSync(tarballPath)) fs.unlinkSync(tarballPath);
    if (tempDirObj) tempDirObj.removeCallback();
  });

  it("should run via npx successfully and execute eslint/PO025", () => {
    let output;
    try {
      const cmd = `npx -y --package "${tarballPath}" apigeelint -f compact.js -s ${proxyPath}`;
      debug(`cmd: ${cmd}`);
      output = cp.execSync(cmd, {
        cwd: currentTempDir, // maybe a drive letter on Win32
        encoding: "utf8",
      });
      // execSync show throw, due to a non-zero exit code.
      assert.fail();
    } catch (error) {
      output = error.stdout.toString();
      debug(`npx output: ${output}`);
    }

    // at least one PO025 message - this is the eslint plugin
    assert.match(output, /PO025/, "Output should contain PO025 error");
    // none of them should say "eslint not found"
    assert.doesNotMatch(output, /eslint not found/);
  });
});
