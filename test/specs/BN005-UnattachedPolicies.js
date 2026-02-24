/*
  Copyright 2019-2021, 2024 Google LLC

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
  testID = "BN005",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js");

configuration.source.path =
  describe("BN005 - Check for unattached policies", function () {
    let report = null;
    const insure = () => {
      if (report == null) {
        let c = { ...configuration };
        c.source.path =
          "./test/fixtures/resources/sampleProxy/24Solver/apiproxy/";
        debug("test configuration: " + JSON.stringify(c));
        let bundle = new Bundle(c);
        debug(`looking in ${bundle.root}`);
        bl.executePlugin(testID, bundle);
        report = bundle.getReport();
        debug(report);
      }
    };

    const test = (expectFound) => (filename) => {
      const description = `should ${expectFound ? "" : "not "}mark ${filename} as unattached in report`;
      it(description, function () {
        insure();
        let fileWasFound = false;
        let foundIssue = false;
        for (let i = 0; i < report.length && !foundIssue; i++) {
          const reportObj = report[i];
          debug(`lookingat filePath: ${reportObj.filePath}`);
          if (reportObj.filePath.endsWith(filename)) {
            fileWasFound = true;
            foundIssue = reportObj.messages.find(
              (msg) => msg.ruleId === "BN005",
            );
          }
        }
        assert.ok(fileWasFound);
        assert.equal(!!foundIssue, expectFound);
      });
    };

    const positiveCase = test(true);
    const unattachedFiles = [
      "ExtractVariables.xml",
      "ExtractVariables_1.xml",
      "ExtractVariables_unattached.xml",
      "badServiceCallout.xml",
      "jsCalculate.xml",
    ];
    for (let i = 0; i < unattachedFiles.length; i++) {
      positiveCase(unattachedFiles[i]);
    }

    const negativeCase = test(false);
    const attachedFiles = [
      "JSONThreatProtection.xml",
      "regExLookAround.xml",
      "AssignMessagebadDisplayName.xml",
      "ExtractParamVariables.xml",
      "ExtractPayloadVariables.xml",
      "statColl.xml",
      "lookup.xml",
    ];

    for (let i = 0; i < attachedFiles.length; i++) {
      negativeCase(attachedFiles[i]);
    }
  });
