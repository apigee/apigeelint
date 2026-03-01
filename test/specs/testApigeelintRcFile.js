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
  debug = require("debug")(`apigeelint:rc-test`),
  tmp = require("tmp"),
  child_process = require("node:child_process");

describe("cli options handling", function () {
  this.slow(61000);
  this.timeout(8000);
  const path = require("node:path"),
    fs = require("node:fs"),
    issue608Dir = path.resolve(__dirname, "../fixtures/resources/issue608"),
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
    env: { ...process.env, DEBUG: "apigeelint:cli,apigeelint:rc" },
  };

  const runOne = (cliOpts, checkCb) => {
    fs.cpSync(
      path.resolve(issue608Dir, "package.json"),
      path.resolve(tmpdir.name, "package.json"),
      { force: true },
    );
    fs.cpSync(
      path.resolve(issue608Dir, ".apigeelintrc"),
      path.resolve(tmpdir.name, ".apigeelintrc"),
      { force: true },
    );

    // npm install can take a very long time, sometimes.
    // NB: multiple tests result in re-install of apigeelint in the same directory.
    child_process.exec("npm install", spawnOpts, (e, stdout, stderr) => {
      assert.equal(e, null);
      debug(stdout);
      // get the current cli.js, to allow testing of it.
      const srcCli = path.resolve(__dirname, "../../cli.js"),
        destCli = path.resolve(tmpdir.name, "node_modules/apigeelint/cli.js");
      fs.cpSync(srcCli, destCli, { force: true });
      // and bundleLinter too
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

  it("should use the default configuration with --norc", function (done) {
    this.timeout(158000);
    if (debug.enabled) {
      const r = child_process.spawnSync("which", ["node"], spawnOpts);
      debug(`node: ` + JSON.stringify(r));
    }

    // run apigeelint after npm install with --norc, it should use
    // default profile and default formatter.
    runOne(
      ["-s", path.resolve(issue608Dir, "just-warnings/apiproxy"), "--norc"],
      (code, items) => {
        // console.log("items: " + JSON.stringify(items, null, 2));
        // status code 0 = apigeelint found zero errors, and possibly a few warnings
        // status code 1 = apigeelint found at least one error, or more than a few warnings
        assert.equal(code, 1, "return status code");
        const itemsWithMessages = items.filter((item) => item.messages.length);
        assert.equal(
          itemsWithMessages.length,
          3,
          "number of items with messages",
        );
        const target1Items = itemsWithMessages.filter((item) =>
          item.filePath.endsWith(
            path.normalize("/apiproxy/targets/target-1.xml"),
          ),
        );
        assert.equal(target1Items.length, 1);
        assert.ok(target1Items[0].messages.length);
        // with --norc, the default is profile=apigee
        assert.ok(
          target1Items[0].messages.find((m) =>
            m.message.endsWith("on profile=apigee"),
          ),
        );
        // assert that we also found TD002, TD007 errors
        assert.ok(target1Items[0].messages.find((m) => m.ruleId == "TD007"));
        assert.ok(target1Items[0].messages.find((m) => m.ruleId == "TD002"));
        done();
      },
    );
  });

  it("should ingest the right configuration with apigeelintrc", function (done) {
    this.timeout(58000);
    if (debug.enabled) {
      const r = child_process.spawnSync("which", ["node"], spawnOpts);
      debug(`node: ` + JSON.stringify(r));
    }

    // Run apigeelint after npm install; it should find and use the apigeelintrc file.
    runOne(
      ["-s", path.resolve(issue608Dir, "just-warnings/apiproxy")],
      (code, items) => {
        // console.log("items: " + JSON.stringify(items, null, 2));
        assert.equal(code, 1, "return status code");
        const itemsWithMessages = items.filter((item) => item.messages.length);
        assert.equal(
          itemsWithMessages.length,
          2,
          "number of items with messages",
        );
        const target1Items = itemsWithMessages.filter((item) =>
          item.filePath.endsWith(
            path.normalize("/apiproxy/targets/target-1.xml"),
          ),
        );
        assert.equal(target1Items.length, 0);
        // assert no TD002, TD007 errors. Such warnings would appear on the
        // target, and we've already determined that the target-1 has no warnings,
        // so this check is redundant.
        assert.ok(!items[0].messages.find((m) => m.ruleId == "TD007"));
        assert.ok(!items[0].messages.find((m) => m.ruleId == "TD002"));
        done();
      },
    );
  });

  it("should exit with a non-zero exit code when it finds errors", function (done) {
    this.timeout(58000);
    if (debug.enabled) {
      const r = child_process.spawnSync("which", ["node"], spawnOpts);
      debug(`node: ` + JSON.stringify(r));
    }
    runOne(
      ["-s", path.resolve(issue608Dir, "some-errors/apiproxy")],
      (code, items) => {
        // expect status code 1 = apigeelint found at least one error
        assert.equal(code, 1, "return status code");
        done();
      },
    );
  });
});
