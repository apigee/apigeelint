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
      util = require("util"),
      testID = "PO002",
      debug = require("debug")("apigeelint:" + testID),
      Bundle = require("../../lib/package/Bundle.js"),
      bl = require("../../lib/package/bundleLinter.js"),
      Policy = require("../../lib/package/Policy.js"),
      Step = require("../../lib/package/Step.js"),
      Flow = require("../../lib/package/Flow.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Dom = require("@xmldom/xmldom").DOMParser,
      test = function(caseNum, exp, stepExp, flowExp, assertion) {
        it(`tests case ${caseNum}, expect(${assertion})`,
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
             });
           }
          );
      };

// This test does not test the policy config, but rather the policy attachment.
// So we can use the same policy configuration for every test case.
const policyXml =
    `<XMLThreatProtection async="false" continueOnError="false" enabled="true" name="XML-Threat-Protection-1">
     <DisplayName>XML Threat Protection 1</DisplayName>
     <NameLimits>
        <Element>10</Element>
        <Attribute>10</Attribute>
        <NamespacePrefix>10</NamespacePrefix>
        <ProcessingInstructionTarget>10</ProcessingInstructionTarget>
     </NameLimits>
     <Source>request</Source>
     <StructureLimits>
        <NodeDepth>5</NodeDepth>
        <AttributeCountPerElement>2</AttributeCountPerElement>
        <NamespaceCountPerElement>3</NamespaceCountPerElement>
        <ChildCount includeComment="true" includeElement="true" includeProcessingInstruction="true" includeText="true">3</ChildCount>
     </StructureLimits>
     <ValueLimits>
        <Text>15</Text>
        <Attribute>10</Attribute>
        <NamespaceURI>10</NamespaceURI>
        <Comment>10</Comment>
        <ProcessingInstructionData>10</ProcessingInstructionData>
     </ValueLimits>
  </XMLThreatProtection>`;

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
      <Name>XML-Threat-Protection-1</Name>
  </Step>`,
    null,
    false //attached good condition
  );

  test(
    3,
    policyXml,
    `<Step>
      <Condition>foo != ""</Condition>
      <Name>XML-Threat-Protection-1</Name>
  </Step>`,
    null,
    true //attached insufficient condition
  );

  test(
    4,
    policyXml,
    `<Step>
      <Condition>foo != ""</Condition>
      <Name>XML-Threat-Protection-1</Name>
  </Step>`,
    `<Flow name="flow2">
          <Step>
              <Condition>foo != ""</Condition>
              <Name>XML-Threat-Protection-1</Name>
          </Step>
          <Condition/>
      </Flow>`,
    true //attached insufficient condition
  );

  test(
    5,
    policyXml,
    ` <Step>
          <Condition>foo != ""</Condition>
          <Name>XML-Threat-Protection-1</Name>
      </Step>`,
    ` <Flow name="flow2">
          <Step>
              <Condition>foo != ""</Condition>
              <Name>XML-Threat-Protection-1</Name>
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
    false //not extractVar
  );

});

describe(`${testID} - Print plugin results`, function() {
  debug("test configuration: " + JSON.stringify(configuration));

  let bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);
  let report = bundle.getReport();
  debug("raw report: \n" + util.format(report));

  it("should create a report object with valid schema", function() {
    let formatter = bl.getFormatter("json.js");

    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }
    let schema = require("./../fixtures/reportSchema.js"),
        Validator = require("jsonschema").Validator,
        v = new Validator(),
        formattedReport = formatter(report),
        parsedReport = JSON.parse(formattedReport),
        validationResult = v.validate(parsedReport, schema);
    debug("json formatted report: \n" + formattedReport);
    assert.equal(
      validationResult.errors.length,
      0,
      validationResult.errors
    );
  });

  it("should create a unixstyle report", function() {
    let unixFormatter = bl.getFormatter("unix.js"),
        formattedReport = unixFormatter(report);
    debug("unix formatted report: \n" + formattedReport);
    assert.ok(report);
  });

});
