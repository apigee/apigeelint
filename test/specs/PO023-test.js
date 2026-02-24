/*
  Copyright 2019-2025 Google LLC

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
  util = require("node:util"),
  ruleId = "PO023",
  debug = require("debug")("apigeelint:" + ruleId),
  bl = require("../../lib/package/bundleLinter.js");

const testOne = (testcase, _label) => {
  it(`${testcase.testname} should generate ${testcase.expectErrors ? "the expected" : "no"} errors`, () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PO023/bundles",
          testcase.testname,
          "apiproxy",
        ),
        bundleType: "apiproxy",
      },
      profile: testcase.profile,
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    debug(`${ruleId} configuration: ${util.format(configuration)}`);
    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const po023Items = items.filter((item) =>
        item.messages.some((m) => m.ruleId == "PO023"),
      );
      debug(`po023Items: ${util.format(po023Items.map((i) => i.filePath))}`);

      if (!testcase.expectErrors) {
        assert.equal(po023Items.length, 0);
      } else {
        assert.equal(po023Items.length, Object.keys(testcase.expected).length);

        Object.keys(testcase.expected).forEach((policyName, caseNum) => {
          debug(`policyName: ${policyName}`);
          const policyItems = po023Items.filter((item) =>
            item.filePath.endsWith(policyName),
          );
          debug(`policyItems: ${util.format(policyItems)}`);

          assert.equal(policyItems.length, 1);
          const po023Messages = policyItems[0].messages.filter(
            (m) => m.ruleId == "PO023",
          );
          debug(`po023Messages: ${util.format(po023Messages)}`);
          assert.equal(
            po023Messages.length,
            testcase.expected[policyName].length,
          );
          //po023Messages.forEach((m, _ix) => assert.equal(m.severity, 1));

          testcase.expected[policyName].forEach((item, ix) => {
            assert.equal(
              po023Messages[ix].message,
              item,
              `${policyName} case(${caseNum}) message(${ix})`,
            );
          });
        });
      }
    });
  });
};

const testCases = [
  {
    testname: "pass-test1",
    profile: "apigeex",
    expectErrors: false,
    expected: null,
  },
  {
    testname: "fail-test2",
    profile: "apigeex",
    expectErrors: true,
    expected: {
      "Quota-1.xml": [
        "Quota policy 'Quota-1' is enabled more than once (2 times) with the condition '' in the Request phase (PreFlow)",
      ],
    },
  },
  {
    testname: "fail-test3",
    profile: "apigeex",
    expectErrors: true,
    expected: {
      "Quota-1.xml": [
        "Quota policy 'Quota-1' is enabled more than once (2 times) with the condition '' in the Request phase (flow1)",
      ],
    },
  },
  {
    testname: "pass-test4",
    profile: "apigeex",
    expectErrors: false,
    expected: null,
  },
  {
    testname: "pass-test5",
    profile: "apigeex",
    expectErrors: false,
  },
  {
    testname: "pass-test6",
    profile: "apigeex",
    expectErrors: false,
  },
  {
    testname: "fail-test7",
    profile: "apigeex",
    expectErrors: true,
    expected: {
      "Q-LLM-Failover-Counter.xml": [
        "Quota policy 'Q-LLM-Failover-Counter' is enabled more than once (2 times) with the condition '' in the FaultRule phase (LLMQuota)",
      ],
    },
  },
];

describe(`PO023 - Quota reuse`, () => {
  testCases.forEach((tc, ix0) => {
    testOne(tc, `case ${ix0}`);
  });
});
