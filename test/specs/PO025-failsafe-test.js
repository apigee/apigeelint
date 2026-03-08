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

/* global describe, it */

const testID = "PO025",
  assert = require("node:assert"),
  path = require("node:path"),
  fs = require("node:fs"),
  { runCliIntegrationTest } = require("../fixtures/cli-test-helper.js"),
  debug = require("debug")("apigeelint:" + testID);

describe(`${testID} - esLint Failsafe`, function () {
  this.timeout(180000);
  this.slow(120000);

  it("should report an error message when the eslint binary is missing", function (done) {
    const fixtureDir = path.resolve(
      __dirname,
      "../fixtures/resources/PO025/fail",
    );

    const options = {
      testDir: fixtureDir,
      cliArgs: [
        "-s",
        path.join(fixtureDir, "apiproxy"),
        "-e",
        "PO013",
        "--norc",
        "--formatter",
        "json.js",
      ],
      preExecHook: (tmpdirPath) => {
        // Delete the eslint binary to trigger the failsafe
        const eslintBin = path.join(tmpdirPath, "node_modules/.bin/eslint");
        if (!fs.existsSync(eslintBin)) {
          assert.fail("eslint binary should exist before deletion");
        }
        fs.unlinkSync(eslintBin);

        // Also delete the package directory to be sure
        const eslintPkg = path.join(tmpdirPath, "node_modules/eslint");
        if (!fs.existsSync(eslintPkg)) {
          assert.fail("eslint package should exist before deletion");
        }
        fs.rmSync(eslintPkg, { recursive: true, force: true });
      },
      env: { DEBUG: "apigeelint:PO025,apigeelint:cli-test-helper" },
    };

    runCliIntegrationTest(options, (code, items, stderr) => {
      // Find the report for the JS file
      const jsFileReport = items.find((r) =>
        r.filePath.endsWith("source-code.js"),
      );
      assert.ok(jsFileReport, "Should have a report for source-code.js");

      const messages = jsFileReport.messages;
      debug(JSON.stringify(messages));
      const hasFailsafeMessage = messages.some(
        (m) =>
          m.message.includes("ESLint execution error") ||
          m.message.includes("ESLint returned error status") ||
          m.message.includes("ENOENT"),
      );

      assert.ok(
        hasFailsafeMessage,
        "Should report a failsafe error message when eslint is missing",
      );
      assert.strictEqual(
        jsFileReport.errorCount > 0 || jsFileReport.warningCount > 0,
        true,
        "Should have errors/warnings",
      );
      done();
    });
  });
});
