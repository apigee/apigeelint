/*
  Copyright © 2019-2021, 2025-2026 Google LLC

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

const assert = require("node:assert"),
  cp = require("node:child_process"),
  testID = "PO025",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID));

describe(`${testID} - ${plugin.plugin.name}`, function () {
  it("should create a json-formatted report object with valid schema", function () {
    this.timeout(5000);
    debug("test configuration: " + JSON.stringify(configuration));
    const bundle = new Bundle(configuration);
    bl.executePlugin(testID, bundle);
    const report = bundle.getReport();

    const formatter = bl.getFormatter("json.js");
    assert.ok(formatter, "formatter implementation not defined");

    const schema = require("../fixtures/reportSchema.js"),
      Validator = require("jsonschema").Validator,
      v = new Validator(),
      jsonReport = JSON.parse(formatter(report)),
      validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  });

  it("should create a unix-formatted report object", function () {
    this.timeout(5000);
    debug("test configuration: " + JSON.stringify(configuration));
    const bundle = new Bundle(configuration);
    bl.executePlugin(testID, bundle);
    const report = bundle.getReport();

    const formatter = bl.getFormatter("unix.js"),
      formattedReport = formatter(report);
    debug("unix formatted report: \n" + formattedReport);
    assert.ok(formattedReport);
  });

  it("should flag a missing semicolon and unused variable in PO025/fail", function () {
    const config = {
      debug: false,
      source: {
        type: "filesystem",
        path: "./test/fixtures/resources/PO025/fail/apiproxy",
        bundleType: "apiproxy",
      },
      excluded: {},
    };
    const bundle = new Bundle(config);
    // The ESLint will find the eslint.config.js file in the apiproxy directory.
    bl.executePlugin(testID, bundle);
    const report = bundle.getReport();

    // Find the report for the JS file
    const jsFileReport = report.find((r) =>
      r.filePath.endsWith("source-code.js"),
    );
    assert.ok(jsFileReport, "Should have a report for source-code.js");

    const messages = jsFileReport.messages;
    const hasSemi = messages.some((m) => m.message.includes("semi"));
    const hasUnused = messages.some((m) =>
      m.message.includes("no-unused-vars"),
    );

    assert.ok(hasSemi, "Should flag missing semicolon (semi rule)");
    assert.ok(hasUnused, "Should flag unused variable (no-unused-vars rule)");
  });

  it("should handle spawnSync execution error (coverage for result.error)", function () {
    const originalSpawnSync = cp.spawnSync;
    cp.spawnSync = (cmd, args, opts) => {
      // only mock if it looks like an eslint call
      if (args[0].includes("eslint")) {
        return { error: new Error("mocked error") };
      }
      return originalSpawnSync(cmd, args, opts);
    };

    try {
      const bundle = new Bundle(configuration);
      bl.executePlugin(testID, bundle);
      const report = bundle.getReport();

      const jsFileReports = report.filter((r) => r.filePath.endsWith(".js"));
      debug(`jsFileReports count: ${jsFileReports.length}`);
      let foundMockError = false;
      jsFileReports.forEach((r) => {
        debug(`Checking report for ${r.filePath}`);
        if (
          r.messages.some((m) =>
            m.message.includes("ESLint execution error: mocked error"),
          )
        ) {
          foundMockError = true;
        }
      });

      assert.ok(
        foundMockError,
        "Should report the mocked execution error in at least one JS resource",
      );
    } finally {
      cp.spawnSync = originalSpawnSync;
    }
  });

  it("should handle spawnSync stderr with status 0 (coverage for result.stderr)", function () {
    const originalSpawnSync = cp.spawnSync;
    cp.spawnSync = () => ({
      status: 0,
      stdout: "[]",
      stderr: "mocked stderr message",
    });

    try {
      const bundle = new Bundle(configuration);
      bl.executePlugin(testID, bundle);
      // We mainly verify that it doesn't crash and completes.
      // The stderr is logged to debug which we don't assert here easily.
      assert.ok(true);
    } finally {
      cp.spawnSync = originalSpawnSync;
    }
  });
});
