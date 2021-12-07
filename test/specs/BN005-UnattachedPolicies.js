/*
  Copyright 2019-2021 Google LLC

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
      testID = 'BN005',
      debug = require("debug")("apigeelint:" + testID),
      Bundle = require("../../lib/package/Bundle.js"),
      bl = require("../../lib/package/bundleLinter.js");

debug("test configuration: " + JSON.stringify(configuration));
describe("BN005 - Check for unattached policies", function() {
  let bundle = new Bundle(configuration);
  debug(`looking in ${bundle.root}`);
  bl.executePlugin(testID, bundle);
  let report = bundle.getReport();

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

  function runTests(files, a) {
    for (var j = 0; j < files.length; j++) {
      let file = files[j],
          description = `should ${(a? "": "not ")} mark ${file} as unattached in report`;

      it(description,
         function() {
           var found = false;
           for (var i = 0; i < report.length && !found; i++) {
             var reportObj = report[i];
             if (reportObj.filePath.endsWith(file)) {
               reportObj.messages.forEach(function(msg) {
                 if (msg.ruleId === "BN005") {
                   found = true;
                 }
               });
             }
           }
           assert.equal(found, a);
         }
        );
    }
  }

  runTests(unattachedFiles, true);
  runTests(attachedFiles, false);
});
