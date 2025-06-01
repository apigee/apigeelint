/*
  Copyright 2019-2021,2023,2025 Google LLC

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

/* global describe, it, configuration */

const assert = require("assert"),
  path = require("path"),
  util = require("util"),
  testID = "BN009",
  debug = require("debug")(`apigeelint:${testID}-test`),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID));

const testOneProxy = (proxyName, expected) => {
  const configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: path.resolve(
        __dirname,
        `../fixtures/resources/statistics_collector/${proxyName}/apiproxy`,
      ),
      bundleType: "apiproxy",
    },
    profile: "apigee",
    excluded: {},
    setExitCode: false,
    output: () => {}, // suppress output
  };

  bl.lint(configuration, (bundle) => {
    const items = bundle.getReport();
    assert.ok(items);
    assert.ok(items.length);

    const bn009Errors = items.filter((item) =>
      item.messages.find((m) => m.ruleId == "BN009"),
    );
    debug(`bn009: ${JSON.stringify(bn009Errors, null, 2)}`);

    const processed = [];
    Object.keys(expected).forEach((policyName, px) => {
      const policyItems = items.filter((m) => m.filePath.endsWith(policyName));
      assert.equal(
        policyItems.length,
        1,
        `No errors found for policy ${policyName}`,
      );

      const bn009Messages = policyItems[0].messages.filter(
        (m) => m.ruleId == testID,
      );
      assert.equal(bn009Messages.length, expected[policyName].length);

      debug(`expected[${policyName}]: ${util.format(expected[policyName])}`);

      expected[policyName].forEach((expectedItem, ix) => {
        const matched = bn009Messages.find(
          (item) => item.message == expectedItem.message,
        );
        assert.ok(matched, `did not find message like ${expectedItem.message}`);
        Object.keys(expectedItem).find((key) => {
          assert.ok(
            matched[key],
            expectedItem[key],
            `case(${px},${ix}) key(${key})`,
          );
        });
      });
      processed.push(policyName);
    });

    const allFilesWithBn009Errors = bn009Errors.map((item) =>
      item.filePath.split(path.sep).pop(),
    );

    debug(`allFilesWithBN009: ${allFilesWithBn009Errors}`);
    const notProcessed = allFilesWithBn009Errors.filter(
      (x) => !processed.includes(x),
    );
    debug(`notProcessed: ${notProcessed}`);
    assert.equal(notProcessed.length, 0);
  });
};

describe(`${testID} - MultipleStatsCollectors`, () => {
  it("should generate errors for duplicates", () => {
    const expected = {
      "Stats-Address-1.xml": [
        {
          message:
            "The following StatisticsCollector policies are duplicates: Stats-Address-1a",
        },
        {
          message:
            "Stats-Address-1 is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes.",
        },
      ],
      "Stats-Username-1.xml": [
        {
          message:
            "The following StatisticsCollector policies are duplicates: Stats-Username-1a",
        },
        {
          message:
            "Stats-Username-1 is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes.",
        },
      ],
      "Stats-Username-1a.xml": [
        {
          message:
            "Stats-Username-1a is attached to multiple steps, but all the steps don't have a condition. This may result in unexpected behaviour.",
        },
        {
          message:
            "Stats-Username-1a is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes.",
        },
      ],
    };

    testOneProxy("duplicates", expected);
  });

  it("should generate errors for no_condition", () => {
    const expected = {};

    testOneProxy("no_condition", expected);
  });

  it("should generate errors for twosteps_one_condition", () => {
    const expected = {
      "Stats-1.xml": [
        {
          message:
            "Stats-1 is attached to multiple steps, but all the steps don't have a condition. This may result in unexpected behaviour.",
        },
      ],
    };

    testOneProxy("twosteps_one_condition", expected);
  });

  it("should generate errors for multiple_missing_conditions", () => {
    const expected = {
      "Stats-1.xml": [
        {
          message:
            "Stats-1 is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes.",
        },
      ],
      "Stats-2.xml": [
        {
          message:
            "Stats-2 is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes.",
        },
      ],
      "Stats-3.xml": [
        {
          message:
            "Stats-3 is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes.",
        },
      ],
      "Stats-4.xml": [
        {
          message:
            "Stats-4 is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes.",
        },
      ],
    };

    testOneProxy("multiple_missing_conditions", expected);
  });
});

describe(`${testID} - print plugin results for ${plugin.plugin.name}`, function () {
  it("should create a report object with valid schema", function () {
    debug("test configuration: " + JSON.stringify(configuration));
    const bundle = new Bundle(configuration);
    bl.executePlugin(testID, bundle);
    const report = bundle.getReport();
    assert.ok(report);
    const formatter = bl.getFormatter("json.js");
    assert.ok(formatter);

    const schema = require("./../fixtures/reportSchema.js"),
      Validator = require("jsonschema").Validator,
      v = new Validator(),
      jsonReport = JSON.parse(formatter(report)),
      validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  });
});
