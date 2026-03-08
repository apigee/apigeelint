/*
  Copyright © 2024-2026 Google LLC

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
  { runCliIntegrationTest } = require("../fixtures/cli-test-helper.js");

describe("cli external plugin warning verification", function () {
  this.slow(11000);
  const issue515Dir = path.resolve(__dirname, "../fixtures/resources/issue515");

  it("should log a warning for stray files in the external plugins dir", function (done) {
    this.timeout(128000);
    this.slow(45000);
    const options = {
      testDir: issue515Dir,
      cliArgs: [
        "-s",
        path.resolve(issue515Dir, "sample/apiproxy"),
        "-x",
        path.resolve(issue515Dir, "external-plugins"),
      ],
      env: { DEBUG: "apigeelint:issue515" },
    };

    runCliIntegrationTest(options, (code, items, stderr) => {
      assert.equal(code, 0, "return status code");
      assert.ok(
        stderr.startsWith(
          "Unexpected .js/.cjs file in external plugins directory:",
        ),
        "error messages",
      );
      assert.equal(stderr.trim().split("\n").length, 1, "error messages");
      done();
    });
  });
});
