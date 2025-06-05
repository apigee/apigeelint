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

/* global describe, it, __dirname */

const assert = require("assert"),
  path = require("path"),
  util = require("util"),
  ruleId = "BN014",
  debug = require("debug")("apigeelint:" + ruleId),
  bl = require("../../lib/package/bundleLinter.js");

const testOneProxy = (proxyName, expectedErrors) => {
  const configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: path.resolve(
        __dirname,
        `../fixtures/resources/BN014/${proxyName}`,
        "apiproxy",
      ),
      bundleType: "apiproxy",
      profile: "apigeex",
    },
    excluded: {},
    setExitCode: false,
    output: () => {}, // suppress output
  };

  debug(`BN014 configuration: ${util.format(configuration)}`);
  bl.lint(configuration, (bundle) => {
    const items = bundle.getReport();
    assert.ok(items);
    assert.ok(items.length);
    const bn014Items = items.filter((item) =>
      item.messages.some((m) => m.ruleId == "BN014"),
    );

    debug(`bn014Items: ${util.format(bn014Items.map((i) => i.filePath))}`);
    assert.equal(bn014Items.length, Object.keys(expectedErrors).length);

    Object.keys(expectedErrors).forEach((policyName, caseNum) => {
      debug(`policyName: ${policyName}`);
      const expectedThisPolicy = expectedErrors[policyName];
      const policyItems = bn014Items.filter((item) =>
        item.filePath.endsWith(policyName),
      );
      debug(`policyItems: ${util.format(policyItems)}`);

      assert.equal(policyItems.length, 1);
      const bn014Messages = policyItems[0].messages
        .filter((m) => m.ruleId == "BN014")
        .map((item) => item.message);
      debug(`bn014Messages: ${util.format(bn014Messages)}`);
      assert.equal(bn014Messages.length, expectedThisPolicy.length);
      expectedThisPolicy.forEach((msg) =>
        assert.ok(
          bn014Messages.find((m) => m == msg),
          `expected(${msg}) not found in (${bn014Messages})`,
        ),
      );
    });
  });
};

describe(`BN014 - Duplicate policies`, () => {
  it("should generate the expected errors", () => {
    const expectedErrors = {
      "CORS-A.xml": [
        "Policy CORS-A is a duplicate of Policy CORS-1. Eliminate duplicates and attach a single policy in multiple places.",
      ],
      "AM-Response-2.xml": [
        "Policy AM-Response-2 is a duplicate of Policy AM-Response. Eliminate duplicates and attach a single policy in multiple places.",
      ],
    };

    testOneProxy("cors-test", expectedErrors);
  });

  it("should find no duplicates", () => {
    testOneProxy("wssec-enc", {});
  });
});
