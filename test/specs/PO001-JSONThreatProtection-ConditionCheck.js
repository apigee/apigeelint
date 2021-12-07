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
/* global it, describe */

const assert = require("assert"),
      testID = "PO001",
      debug = require("debug")("apigeelint:" + testID),
      bl = require("../../lib/package/bundleLinter.js"),
      Bundle = require("../../lib/package/Bundle.js"),
      Policy = require("../../lib/package/Policy.js"),
      Step = require("../../lib/package/Step.js"),
      Flow = require("../../lib/package/Flow.js"),
      plugin = require(bl.resolvePlugin(testID)),
      expectedMessage = 'An appropriate check for a message body was not found on the enclosing Step or Flow.',
      Dom = require("@xmldom/xmldom").DOMParser,
      test = function(caseNum, exp, stepExp, flowExp, assertion) {
        it(`test case ${caseNum}, expect(${assertion})`,
           function() {
             let pDoc = new Dom().parseFromString(exp),
                 sDoc,
                 fDoc,
                 p = new Policy(pDoc.documentElement, this),
                 s,
                 f;

             let origAddMessage = p.addMessage;
             p.addMessage = function(msg) {
               //debug(msg);
               origAddMessage.call(p, msg);
             };
             p.getElement = function() {
               return pDoc.documentElement;
             };
             p.getSteps = function() {
               if (s) return [s];
               return [];
             };

             if (flowExp) {
               fDoc = new Dom().parseFromString(flowExp);
               f = new Flow(fDoc.documentElement, null);
             }

             if (stepExp) {
               sDoc = new Dom().parseFromString(stepExp);
               s = new Step(sDoc.documentElement, f);
             }

             plugin.onPolicy(p, function(e, flagged) {
               assert.equal(e, undefined, e ? " error " : " no error");
               assert.equal(
                 flagged,
                 assertion,
                 flagged
                   ? "warning/error was returned"
                   : "warning/error was not returned"
               );
               if (flagged) {
                 let report = p.getReport(),
                     msgs = report.messages;
                 assert.ok(msgs, "missing messages");
                 assert.equal(msgs.length, 1, "incorrect number of messages");
                 assert.equal(msgs[0].message, expectedMessage);
               }
             });
           }
          );
      };

// This test does not test the policy config, but rather the policy attachment.
// So we can use the same policy configuration for every test case.
const policyXml =   `<JSONThreatProtection async="false" continueOnError="false" enabled="true" name="JSON-Threat-Protection-1">
   <DisplayName>JSON Threat Protection 1</DisplayName>
   <ArrayElementCount>20</ArrayElementCount>
   <ContainerDepth>10</ContainerDepth>
   <ObjectEntryCount>15</ObjectEntryCount>
   <ObjectEntryNameLength>50</ObjectEntryNameLength>
   <Source>request</Source>
   <StringValueLength>500</StringValueLength>
</JSONThreatProtection>`;


describe(`${testID} - ${plugin.plugin.name}`, function() {
  test(
    1,
    policyXml,
    null,
    null,
    false //not attached
  );

  test(
    2,
    policyXml,
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name>JSON-Threat-Protection-1</Name>
  </Step>`,
    null,
    false //attached good condition
  );


  test(
    3,
    policyXml,
    `<Step>
    <Condition>foo != ""</Condition>
    <Name>JSON-Threat-Protection-1</Name>
</Step>`,
    null,
    true //attached insufficient condition
  );


  test(
    4,
    policyXml,
    `<Step>
    <Condition>foo != ""</Condition>
    <Name>JSON-Threat-Protection-1</Name>
</Step>`,
    `<Flow name="flow2">
        <Step>
            <Condition>foo != ""</Condition>
            <Name>JSON-Threat-Protection-1</Name>
        </Step>
        <Condition/>
    </Flow>`,
    true //attached insufficient condition
  );

  test(
    5, policyXml,
    ` <Step>
        <Condition>foo != ""</Condition>
        <Name>JSON-Threat-Protection-1</Name>
    </Step>`,
    ` <Flow name="flow2">
        <Step>
            <Condition>foo != ""</Condition>
            <Name>JSON-Threat-Protection-1</Name>
        </Step>
        <Condition>message.content != ""</Condition>
    </Flow>`,
    false //attached sufficient condition
  );

  test(
    6,
    '<RegularExpressionProtection async="false" continueOnError="false" enabled="true" name="regExLookAround"><DisplayName>regExLookAround</DisplayName><Source>request</Source><IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables><URIPath><Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern></URIPath></RegularExpressionProtection>',
    null,
    null,
    false //not JSONThreatProtection
  );

});


describe(`${testID} - Print plugin results`, function() {
  debug("test configuration: " + JSON.stringify(configuration));
  var bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);
  let report = bundle.getReport();

  it("should create a report object with valid schema", function() {

    let formatter = bl.getFormatter("json.js");
    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }
    let schema = require("./../fixtures/reportSchema.js"),
        Validator = require("jsonschema").Validator,
        v = new Validator(),
        jsonReport = JSON.parse(formatter(report)),
        validationResult = v.validate(jsonReport, schema);
    assert.equal(
      validationResult.errors.length,
      0,
      validationResult.errors
    );
  });

});
