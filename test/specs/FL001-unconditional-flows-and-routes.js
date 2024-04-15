/*
  Copyright 2019-2024 Google LLC

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

const ruleId = "FL001",
  assert = require("assert"),
  path = require("path"),
  util = require("util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - bundle with unconditional flows`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(__dirname, "../fixtures/resources/FL001/apiproxy"),
        bundleType: "apiproxy"
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      assert.ok(actualErrors.length);
      debug(util.format(actualErrors));

      const ep2 = actualErrors.find((e) =>
        e.filePath.endsWith("endpoint2.xml")
      );
      assert.ok(ep2);
      let fl001Messages = ep2.messages.filter((m) => m.ruleId == "FL001");
      assert.equal(fl001Messages.length, 1);
      assert.ok(fl001Messages[0].message);
      assert.equal(
        fl001Messages[0].message,
        "Endpoint has an unconditional Flow that is not the final flow. All following flows will be ignored."
      );

      const ep3 = actualErrors.find((e) =>
        e.filePath.endsWith("endpoint3.xml")
      );
      assert.ok(ep3);
      fl001Messages = ep3.messages.filter((m) => m.ruleId == "FL001");
      assert.equal(fl001Messages.length, 1);
      assert.ok(fl001Messages[0].message);
      assert.equal(
        fl001Messages[0].message,
        "Endpoint has too many unconditional Flow elements (2). Only one will be executed."
      );
    });
  });
});
