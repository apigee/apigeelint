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
/* global configuration, describe, it */
const assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  testID = "BN012",
  debug = require("debug")("apigeelint:" + testID),
  //Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js");

describe("BN012 - Check for unreferenced targets", function () {
  it("should flag unused targets in the test bundle", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/BN012-unreferenced-target/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      //profile: 'apigeex',
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    debug("test configuration: " + JSON.stringify(configuration));
    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      assert.ok(actualErrors.length);
      debug("actualErrors: " + util.format(actualErrors));

      const bn012Items = actualErrors.filter((e) =>
        e.messages.find((m) => m.ruleId == "BN012")
      );

      // target-3 is un-referenced
      debug("bn012Items: " + util.format(bn012Items));
      assert.equal(bn012Items.length, 1);
      debug(util.format(bn012Items[0]));
      assert.ok(bn012Items[0].messages);
      const bn012Messages = bn012Items[0].messages.filter(
        (m) => m.ruleId == "BN012"
      );
      assert.equal(bn012Messages.length, 1);
      assert.equal(
        bn012Messages[0].message,
        "Unreferenced TargetEndpoint target-3. There are no RouteRules that reference this TargetEndpoint."
      );
    });
  });
});
