/*
  Copyright © 2024-2025 Google LLC

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

/* global require, describe, before, after, it, __dirname */

const assert = require("node:assert"),
  Dom = require("@xmldom/xmldom").DOMParser,
  child_process = require("node:child_process"),
  tmp = require("tmp"),
  debug = require("debug")("apigeelint:issue515");

describe("cli external plugin warning verification", function () {
  this.slow(11000);
  const path = require("node:path"),
    fs = require("node:fs"),
    issue515Dir = path.resolve(__dirname, "../fixtures/resources/issue515"),
    tmpdir = tmp.dirSync({
      prefix: `apigeelint-cli-test`,
      keep: false,
      unsafeCleanup: true, // this does not seem to work in apigeelint
    });

  // make sure to cleanup when the process exits
  process.on("exit", function () {
    tmpdir.removeCallback();
  });

  it("should log a warning for stray files in the external plugins dir", function (done) {
    this.timeout(128000);
    const spawnOpts = {
      cwd: tmpdir.name,
      encoding: "utf8",
    };

    if (debug.enabled) {
      const r = child_process.spawnSync("which", ["node"], spawnOpts);
      debug(`node: ` + JSON.stringify(r));
    }

    //  npm install can take a very long time, sometimes.
    fs.cpSync(
      path.resolve(issue515Dir, "package.json"),
      path.resolve(tmpdir.name, "package.json"),
      { force: true },
    );
    child_process.exec("npm install", spawnOpts, (e, stdout, stderr) => {
      assert.equal(e, null);
      debug(stdout);

      // copy all of apigeelint source over, to allow testing of it.
      fs.cpSync(
        path.resolve(__dirname, "../../lib/package"),
        path.resolve(tmpdir.name, "node_modules/apigeelint/lib/package"),
        { recursive: true },
      );
      try {
        // run apigeelint after npm install
        const proc = child_process.spawn(
          "node",
          [
            "./node_modules/apigeelint/cli.js",
            "-s",
            path.resolve(issue515Dir, "sample/apiproxy"),
            "-x",
            path.resolve(issue515Dir, "external-plugins"),
          ],
          { ...spawnOpts, timeout: 20000 },
        );
        let stdoutBlobs = [],
          stderrBlobs = [];
        proc.stdout.on("data", (data) => {
          stdoutBlobs.push(data);
          debug(`stdout blob: ${data}`);
        });
        proc.stderr.on("data", (data) => {
          stderrBlobs.push(data);
          debug(`stderr blob: ${data}`);
        });
        proc.on("exit", (exitCode) =>
          setTimeout(() => debug(`exit: ${exitCode}`), 0),
        );
        proc.on("error", (error) => console.error(`process error: ${error}`));
        proc.on("close", (code) => {
          debug(`child process exited with code ${code}`);
          let aggregatedErrorOutput = stderrBlobs.join("");
          debug(`stderr: ${aggregatedErrorOutput}`);
          if (code != 0) {
            console.log(`exit status: ${code}`);
          }
          assert.equal(code, 0, "return status code");
          assert.ok(
            aggregatedErrorOutput.startsWith(
              "Unexpected .js/.cjs file in external plugins directory:",
            ),
            "error messages",
          );
          assert.equal(
            aggregatedErrorOutput.trim().split("\n").length,
            1,
            "error messages",
          );
          done();
        });
      } catch (ex1) {
        console.log(ex1.stack);
        assert.fail();
      }
    });
  });
});
