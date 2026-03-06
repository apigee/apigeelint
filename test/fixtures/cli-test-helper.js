/*
  Copyright © 2019-2021,2026 Google LLC

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
  child_process = require("node:child_process"),
  path = require("node:path"),
  fs = require("node:fs"),
  tmp = require("tmp"),
  debug = require("debug")("apigeelint:cli-test-helper");

/**
 * Runs a CLI integration test by setting up a temporary environment,
 * performing npm install, mirroring the current source, and spawning the CLI.
 *
 * @param {Object} options
 * @param {string} options.testDir - Directory containing the fixture's package.json
 * @param {string[]} options.cliArgs - Arguments to pass to apigeelint CLI
 * @param {Function} [options.preExecHook] - Callback to manipulate tmpdir before CLI execution
 * @param {Object} [options.env] - Additional environment variables
 * @param {Function} checkCb - Callback called with (exitCode, parsedStdout, stderr)
 */
function runCliIntegrationTest(options, checkCb) {
  const { testDir, cliArgs, preExecHook, env } = options;

  const tmpdir = tmp.dirSync({
    prefix: `apigeelint-cli-test`,
    keep: false,
    unsafeCleanup: true,
  });

  // make sure to cleanup when the process exits
  const cleanup = () => {
    try {
      tmpdir.removeCallback();
    } catch (e) {
      // ignore
    }
  };
  process.on("exit", cleanup);

  const spawnOpts = {
    cwd: tmpdir.name,
    encoding: "utf8",
    env: { ...process.env, ...env },
  };

  // 1. Copy fixture's package.json
  fs.cpSync(
    path.resolve(testDir, "package.json"),
    path.resolve(tmpdir.name, "package.json"),
    {
      force: true,
    },
  );

  if (debug.enabled) {
    const r = child_process.spawnSync("which", ["node"], spawnOpts);
    debug(`node: ` + JSON.stringify(r));
  }

  // 2. npm install (can take a long time)
  child_process.exec("npm install", spawnOpts, (e, stdout, stderr) => {
    if (e) {
      cleanup();
      return assert.fail(`npm install failed: ${e.message}`);
    }
    debug("npm install completed");

    // 3. Mirror current project source into node_modules/apigeelint
    const apigeeLintInTmp = path.resolve(
      tmpdir.name,
      "node_modules/apigeelint",
    );

    // Ensure the directory exists
    fs.mkdirSync(apigeeLintInTmp, { recursive: true });

    // Copy lib, cli.js, and package.json to the tmp node_modules
    const rootDir = path.resolve(__dirname, "../../");
    fs.cpSync(
      path.resolve(rootDir, "lib"),
      path.resolve(apigeeLintInTmp, "lib"),
      { recursive: true, force: true },
    );
    fs.cpSync(
      path.resolve(rootDir, "cli.js"),
      path.resolve(apigeeLintInTmp, "cli.js"),
      { force: true },
    );
    // fs.cpSync(
    //   path.resolve(rootDir, "package.json"),
    //   path.resolve(apigeeLintInTmp, "package.json"),
    //   { force: true },
    // );

    // 4. Run preExecHook if provided
    if (preExecHook) {
      preExecHook(tmpdir.name);
    }

    // 5. Spawn the CLI
    try {
      const proc = child_process.spawn(
        "node",
        [path.resolve(apigeeLintInTmp, "cli.js"), ...cliArgs],
        { ...spawnOpts, timeout: 60000 },
      );

      let stdoutBlobs = [],
        stderrBlobs = [];
      proc.stdout.on("data", (data) => {
        stdoutBlobs.push(data);
      });
      proc.stderr.on("data", (data) => {
        stderrBlobs.push(data);
      });

      proc.on("error", (error) => {
        cleanup();
        assert.fail(`Process error: ${error}`);
      });

      proc.on("close", (code) => {
        const aggregatedStdout = stdoutBlobs.join("");
        const aggregatedStderr = stderrBlobs.join("");

        debug(`CLI exited with code ${code}`);

        let items = [];
        if (aggregatedStdout.trim()) {
          debug("stdout:" + aggregatedStdout);
          try {
            items = JSON.parse(aggregatedStdout);
          } catch (eparse) {
            // If it's not JSON, we pass the raw string if needed,
            // but usually apigeelint output is JSON when format is specified.
            debug(`Stdout is not JSON: ${aggregatedStdout}`);
          }
        }

        debug("stderr:" + aggregatedStderr);
        checkCb(code, items, aggregatedStderr, tmpdir.name);
        cleanup();
        process.removeListener("exit", cleanup);
      });
    } catch (ex) {
      cleanup();
      assert.fail(`Spawn failed: ${ex.message}`);
    }
  });
}

module.exports = {
  runCliIntegrationTest,
};
