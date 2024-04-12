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

const assert = require("assert"),
  path = require("path"),
  util = require("util"),
  ruleId = "PO012",
  debug = require("debug")("apigeelint:" + ruleId),
  bl = require("../../lib/package/bundleLinter.js");

describe(`PO012 - AssignToHygiene`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PO012-assignToHygiene/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    debug(`PO012 configuration: ${util.format(configuration)}`);
    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);

      const expected = {
        "AM-Inject-Proxy-Revision-Header.xml": [
          {
            message: "unnecessary AssignTo with no named message",
            line: 7,
            column: 3
          }
        ],
        "AM-Modify-Request-Remove-ApiKey.xml": [
          {
            message: "unnecessary AssignTo with no named message",
            line: 19,
            column: 5
          }
        ],
        "AM-SetCorsSecurityHeaders.xml": [
          {
            message: "unnecessary AssignTo with no named message",
            line: 28,
            column: 5
          }
        ],
        "AM-AssignProxyFlowName.xml": [
          {
            message: "unnecessary AssignTo with no named message",
            line: 12,
            column: 5
          }
        ],
        "AM-AddCORS.xml": [
          {
            message: "unnecessary AssignTo with no named message",
            line: 16,
            column: 5
          }
        ]
      };

      const po012Items = items.filter((item) =>
        item.messages.some((m) => m.ruleId == "PO012")
      );
      debug(`po012Items: ${util.format(po012Items.map((i) => i.filePath))}`);
      assert.equal(po012Items.length, Object.keys(expected).length);

      Object.keys(expected).forEach((policyName, caseNum) => {
        debug(`policyName: ${policyName}`);
        const policyItems = po012Items.filter((item) =>
          item.filePath.endsWith(policyName)
        );
        debug(`policyItems: ${util.format(policyItems)}`);

        assert.equal(policyItems.length, 1);
        let po012Messages = policyItems[0].messages.filter(
          (m) => m.ruleId == "PO012"
        );
        assert.equal(po012Messages.length, expected[policyName].length);
        po012Messages.forEach((m, ix) => assert.equal(m.severity, 1));

        expected[policyName].forEach((item, ix) => {
          Object.keys(item).forEach((key) => {
            assert.equal(
              po012Messages[ix][key],
              item[key],
              `${policyName} case(${caseNum}) message(${ix}) key(${key})`
            );
          });
        });
      });
    });
  });
});
