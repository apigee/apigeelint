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

describe("cli options handling", function () {
  this.slow(61000);
  this.timeout(8000);
  const issue608Dir = path.resolve(__dirname, "../fixtures/resources/issue608");

  const runOne = (cliOpts, checkCb) => {
    runCliIntegrationTest(
      {
        testDir: issue608Dir,
        cliArgs: cliOpts,
        preExecHook: (tmpdirName) => {
          fs.cpSync(
            path.resolve(issue608Dir, ".apigeelintrc"),
            path.resolve(tmpdirName, ".apigeelintrc"),
            { force: true },
          );
        },
        env: { DEBUG: "apigeelint:cli,apigeelint:rc" },
      },
      checkCb,
    );
  };

  it("should use the default configuration with --norc", function (done) {
    this.timeout(158000);
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
    runOne(
      ["-s", path.resolve(issue608Dir, "some-errors/apiproxy")],
      (code, _items) => {
        // expect status code 1 = apigeelint found at least one error
        assert.equal(code, 1, "return status code");
        done();
      },
    );
  });
});
