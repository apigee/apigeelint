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
  debug = require("debug")(`apigeelint:issue622-test`),
  tmp = require("tmp"),
  path = require("node:path"),
  fs = require("node:fs"),
  child_process = require("node:child_process");

describe("issue622 write file handling", function () {
  this.slow(61000);
  this.timeout(8000);
  const issue622Dir = path.resolve(__dirname, "../fixtures/resources/issue622"),
    tmpdir = tmp.dirSync({
      prefix: `apigeelint-cli-test`,
      keep: false,
      unsafeCleanup: true, // this does not seem to work in apigeelint
    });

  // make sure to cleanup when the process exits
  process.on("exit", function () {
    tmpdir.removeCallback();
  });

  const spawnOpts = {
    cwd: tmpdir.name,
    encoding: "utf8",
    env: { ...process.env, DEBUG: "apigeelint:cli" },
  };

  const runOne = (cliOpts, checkCb) => {
    fs.cpSync(
      path.resolve(issue622Dir, "package.json"),
      path.resolve(tmpdir.name, "package.json"),
      { force: true },
    );

    // npm install can take a very long time, sometimes.
    // NB: multiple tests result in re-install of apigeelint in the same directory.
    child_process.exec("npm install", spawnOpts, (e, stdout, stderr) => {
      assert.equal(e, null);
      debug(stdout);
      // get the bundleLinter.js, to allow testing of it.
      const srcBl = path.resolve(
          __dirname,
          "../../lib/package/bundleLinter.js",
        ),
        destBl = path.resolve(
          tmpdir.name,
          "node_modules/apigeelint/lib/package/bundleLinter.js",
        );
      fs.cpSync(srcBl, destBl, { force: true });
      try {
        const proc = child_process.spawn(
          "node",
          [
            path.resolve(tmpdir.name, "node_modules/apigeelint/cli.js"),
            ...cliOpts,
          ],
          { ...spawnOpts, timeout: 20000 },
        );
        let stdoutBlobs = [],
          stderrBlobs = [];
        proc.stdout.on("data", (data) => {
          stdoutBlobs.push(data);
          debug(`stdout: ${data}`);
        });
        proc.stderr.on("data", (data) => {
          stderrBlobs.push(data);
          debug(`stderr: ${data}`);
        });
        proc.on("exit", (exitCode) => debug(`exit: ${exitCode}`));
        proc.on("error", (error) => console.error(`process error: ${error}`));
        proc.on("close", (code) => {
          let aggregatedStdout = stdoutBlobs.join("\n");
          let aggregatedStderr = stderrBlobs.join("");
          debug(`child process exited with code ${code}`);

          if (code != 0) {
            // Could examine this - with DEBUG=apigeelint:rc, you will see
            // messages indicating parsing of the .apigeelintrc file.
            debug(`agg stderr: ${aggregatedStderr}`);
          }
          debug(`agg stdout: ${aggregatedStdout}`);
          // we should be able to parse stdout as json
          let items = [];
          try {
            items = JSON.parse(aggregatedStdout);
          } catch (eparse) {
            console.log(`while parsing: ${aggregatedStdout}`);
            console.log(eparse.stack);
            assert.fail();
          }
          checkCb(code, items);
        });
      } catch (ex1) {
        console.log(ex1.stack);
        assert.fail();
      }
    });
  };

  it("should write the output file", function (done) {
    this.timeout(158000);
    if (debug.enabled) {
      // this may not work on Windows
      const r = child_process.spawnSync("which", ["node"], spawnOpts);
      debug(`node: ` + JSON.stringify(r));
    }
    runOne(
      [
        "-s",
        path.resolve(issue622Dir, "apiproxy"),
        "--norc",
        "--formatter",
        "codeclimate.js",
        "--profile",
        "apigeex",
        "--write",
        "findings.out",
      ],
      (processExitCode, items) => {
        assert.equal(processExitCode, 0, "return status code");
        assert.equal(items.length, 0, "items");
        const outputContent = fs.readFileSync(
          path.resolve(tmpdir.name, "findings.out"),
          {
            encoding: "utf8",
          },
        );
        assert.equal(outputContent, "[]", "output");
        done();
      },
    );
  });
});
