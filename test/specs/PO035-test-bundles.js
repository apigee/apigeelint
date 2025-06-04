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

const assert = require("assert"),
  path = require("path"),
  util = require("util"),
  ruleId = "PO035",
  debug = require("debug")("apigeelint:" + ruleId),
  bl = require("../../lib/package/bundleLinter.js");

/*
 *
 * At least one of the tests for PO035 depends on the full bundle. Specifically,
 * there is a check in the linter that look for the referenced policy when using
 * UseQuotaConfigInAPIProduct. For that reason we need this test module as well
 * as the one that checks just bare policies.
 *
 **/

const testOne = (testcase, _label) => {
  it(`${testcase.testname} should generate the expected errors`, () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PO035/bundles",
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

    debug(`PO035 configuration: ${util.format(configuration)}`);
    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const po035Items = items.filter((item) =>
        item.messages.some((m) => m.ruleId == "PO035"),
      );
      debug(`po035Items: ${util.format(po035Items.map((i) => i.filePath))}`);

      if (!testcase.expectErrors) {
        assert.equal(po035Items.length, 0);
      } else {
        assert.equal(po035Items.length, Object.keys(testcase.expected).length);

        Object.keys(testcase.expected).forEach((policyName, caseNum) => {
          debug(`policyName: ${policyName}`);
          const policyItems = po035Items.filter((item) =>
            item.filePath.endsWith(policyName),
          );
          debug(`policyItems: ${util.format(policyItems)}`);

          assert.equal(policyItems.length, 1);
          const po035Messages = policyItems[0].messages.filter(
            (m) => m.ruleId == "PO035",
          );
          debug(`po035Messages: ${util.format(po035Messages)}`);
          assert.equal(
            po035Messages.length,
            testcase.expected[policyName].length,
          );
          //po035Messages.forEach((m, _ix) => assert.equal(m.severity, 1));

          testcase.expected[policyName].forEach((item, ix) => {
            assert.equal(
              po035Messages[ix].message,
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
    testname: "fail-test1",
    profile: "apigeex",
    expectErrors: true,
    expected: {
      "Quota-1.xml": [
        "The stepName attribute refers to a policy (VerifyAPIKey-1) that does not exist.",
      ],
    },
  },
  {
    testname: "fail-test2",
    profile: "apigeex",
    expectErrors: true,
    expected: {
      "Quota-1.xml": [
        "The stepName attribute refers to the Quota policy itself.",
      ],
    },
  },
  {
    testname: "fail-test3",
    profile: "apigeex",
    expectErrors: true,
    expected: {
      "Quota-1.xml": [
        "The stepName attribute refers to a policy of the wrong type.",
      ],
    },
  },
  {
    testname: "pass-test1",
    profile: "apigeex",
    expectErrors: false,
    expected: null,
  },
];

describe(`PO035 - Quota hygiene`, () => {
  testCases.forEach((tc, ix0) => {
    testOne(tc, `case ${ix0}`);
  });
});
