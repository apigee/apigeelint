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
  debug = require("debug")("apigeelint:issue515");

describe("cli external plugin warning verification", function () {
  this.slow(11000);
  const path = require("node:path"),
    fs = require("node:fs"),
    proxyDir = path.resolve(__dirname, "../fixtures/resources/issue515"),
    node_modules = path.resolve(proxyDir, "node_modules"),
    packageLock = path.resolve(proxyDir, "package-lock.json");

  const cleanup = (done) => {
    fs.rmSync(node_modules, { force: true, recursive: true });
    fs.rmSync(packageLock, { force: true });
    done();
  };

  before(function (done) {
    // remove node_modules before the test runs. We want a clean install.
    cleanup(done);
  });

  after(function (done) {
    // tidy up after the test runs.
    this.timeout(8000);
    // Sometimes this gets hung and fails. It seems it's a race condition.
    // Trying a timeout to avoid that.
    setTimeout(() => cleanup(done), 2000);
  });

  it("should log a warning for stray files in the external plugins dir", function (done) {
    this.timeout(58000);
    const opts = {
      cwd: proxyDir,
      encoding: "utf8",
    };

    if (debug.enabled) {
      const r = child_process.spawnSync("which", ["node"], opts);
      debug(`node: ` + JSON.stringify(r));
    }

    //  npm install can take a very long time, sometimes.
    child_process.exec("npm install", opts, (e, stdout, stderr) => {
      assert.equal(e, null);
      debug(stdout);
      // copy current implementation over, to allow testing of it.
      const srcPackageDir = path.resolve(__dirname, "../../lib/package"),
        destPackageDir = path.resolve(node_modules, "apigeelint/lib/package");
      // overwrite the installed apigeelint with the current (working) version
      fs.cpSync(srcPackageDir, destPackageDir, { recursive: true });

      try {
        // run apigeelint after npm install
        const proc = child_process.spawn(
          "node",
          [
            "./node_modules/apigeelint/cli.js",
            "-s",
            "sample/apiproxy",
            "-x",
            "external-plugins",
          ],
          { ...opts, timeout: 20000 },
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
