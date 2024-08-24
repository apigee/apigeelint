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
const assert = require("assert"),
  testID = "BN005",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js");

configuration.source.path =
  "./test/fixtures/resources/sampleProxy/24Solver/apiproxy/";

debug("test configuration: " + JSON.stringify(configuration));
describe("BN005 - Check for unattached policies", function () {
  let bundle = new Bundle(configuration);
  debug(`looking in ${bundle.root}`);
  bl.executePlugin(testID, bundle);
  let report = bundle.getReport();
  debug(report);
  var unattachedFiles = [
    "ExtractVariables.xml",
    "ExtractVariables_1.xml",
    "ExtractVariables_unattached.xml",
    "badServiceCallout.xml",
    "jsCalculate.xml"
  ];

  var attachedFiles = [
    "JSONThreatProtection",
    "regExLookAround",
    "AssignMessage.CopyRequest",
    "ExtractParamVariables",
    "ExtractPayloadVariables",
    "publishPurchaseDetails",
    "Lookup-Cache-1",
    "publishPurchaseDetails"
  ];

  function runTests(filenames, expectFound) {
    for (let j = 0; j < filenames.length; j++) {
      const filename = filenames[j],
        description = `should ${expectFound ? "" : "not "}mark ${filename} as unattached in report`;

      it(description, function () {
        let found = false;
        for (let i = 0; i < report.length && !found; i++) {
          const reportObj = report[i];
          if (reportObj.filePath.endsWith(filename)) {
            found = reportObj.messages.find((msg) => msg.ruleId === "BN005");
          }
        }
        assert.equal(!!found, expectFound);
      });
    }
  }

  runTests(unattachedFiles, true);
  runTests(attachedFiles, false);
});
