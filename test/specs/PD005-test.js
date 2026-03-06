/*
  Copyright 2019-2022 Google LLC

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

const ruleId = "PD005",
  assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - bundle with VirtualHost elements`, () => {
  const profiles = ["apigee", "apigeex"];

  const expectations = {
    apigeex: {
      "endpoint1.xml": ["Unnecessary VirtualHost element."],
      "endpoint-multiple.xml": ["Multiple HTTPProxyConnection elements."],
      "endpoint-missing.xml": ["Missing HTTPProxyConnection."]
    },
    apigee: {
      "endpoint1.xml": [],
      "endpoint-multiple.xml": ["Multiple HTTPProxyConnection elements."],
      "endpoint-missing.xml": ["Missing HTTPProxyConnection."]
    }
  };

  profiles.forEach((profile) => {
    it(`should generate the expected errors for profile ${profile}`, () => {
      let configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: path.resolve(
            __dirname,
            "../fixtures/resources/PD005-VirtualHost/apiproxy"
          ),
          bundleType: "apiproxy"
        },
        profile,
        excluded: {},
        setExitCode: false,
        output: () => {} // suppress output
      };

      bl.lint(configuration, (bundle) => {
        let items = bundle.getReport();
        assert.ok(items);
        assert.ok(items.length);

        Object.keys(expectations[profile]).forEach((fileName) => {
          const item = items.find((i) => i.filePath.endsWith(fileName));
          assert.ok(item, `Could not find report for ${fileName}`);

          const pd005Messages = item.messages
            .filter((m) => m.ruleId === ruleId)
            .map((m) => m.message);

          assert.deepEqual(
            pd005Messages,
            expectations[profile][fileName],
            `Unexpected messages for ${fileName} in profile ${profile}`
          );
        });
      });
    });
  });
});
