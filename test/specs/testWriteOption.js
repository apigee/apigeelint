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

const assert = require("node:assert"),
  path = require("node:path"),
  fs = require("node:fs"),
  { runCliIntegrationTest } = require("../fixtures/cli-test-helper.js");

describe("issue622 write file handling", function () {
  this.slow(61000);
  this.timeout(8000);
  const issue622Dir = path.resolve(__dirname, "../fixtures/resources/issue622");

  it("should write the output file", function (done) {
    this.timeout(158000);
    const options = {
      testDir: issue622Dir,
      cliArgs: [
        "-s", path.resolve(issue622Dir, "apiproxy"),
        "--norc",
        "--formatter", "codeclimate.js",
        "--profile", "apigeex",
        "--write", "findings.out",
      ],
      env: { DEBUG: "apigeelint:cli" }
    };

    runCliIntegrationTest(options, (processExitCode, items, stderr, tmpdirPath) => {
      assert.equal(processExitCode, 0, "return status code");
      assert.equal(items.length, 0, "items");
      const outputContent = fs.readFileSync(
        path.resolve(tmpdirPath, "findings.out"),
        {
          encoding: "utf8",
        },
      );
      assert.equal(outputContent, "[]", "output");
      done();
    });
  });
});
