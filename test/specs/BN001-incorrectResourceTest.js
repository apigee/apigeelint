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

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const assert = require("node:assert"),
  path = require("node:path"),
  debug = require("debug")("apigeelint:BN001"),
  bl = require("../../lib/package/bundleLinter.js");

describe(`BN001 - bundle with incorrect resource`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/BN001-incorrect-resources/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      profile: "apigee",
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
      //console.log("**actualErrors: "+ JSON.stringify(actualErrors));
      debug(JSON.stringify(actualErrors, null, 1));

      const bn001Items = actualErrors.filter((e) =>
        e.messages.find((m) => m.ruleId == "BN001")
      );

      assert.equal(bn001Items.length, 1);
      assert.ok(bn001Items[0].messages.length);

      // disregard all warnings or errors except those from this plugin
      bn001Items[0].messages = bn001Items[0].messages.filter(
        (m) => m.ruleId == "BN001"
      );

      assert.equal(bn001Items[0].messages.length, 1);
      assert.ok(bn001Items[0].messages[0].message);
      assert.ok(
        bn001Items[0].messages[0].message.startsWith(
          "Unexpected extension found with file"
        ),
        bn001Items[0].messages[0].message
      );
      assert.ok(
        bn001Items[0].messages[0].message.indexOf("invalid_file.js") > 0,
        bn001Items[0].messages[0].message
      );
    });
  });
});
