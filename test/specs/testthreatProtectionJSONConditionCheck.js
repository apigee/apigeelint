/*
  Copyright 2019-2020 Google LLC

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

const assert = require("assert"),
      testID = "PO001",
      debug = require("debug")("apigeelint:" + testID),
      Bundle = require("../../lib/package/Bundle.js"),
      bl = require("../../lib/package/bundleLinter.js"),
      Policy = require("../../lib/package/Policy.js"),
      Step = require("../../lib/package/Step.js"),
      Flow = require("../../lib/package/Flow.js"),
      plugin = require(bl.resolvePlugin(testID)),

      Dom = require("xmldom").DOMParser,
      test = function(caseNum, exp, stepExp, flowExp, assertion) {
        it(`tests case ${caseNum}, expect(${assertion})`,
           function() {
             let pDoc = new Dom().parseFromString(exp),
                 sDoc,
                 fDoc,
                 p = new Policy(pDoc.documentElement, this),
                 s,
                 f;

             p.addMessage = function(msg) {
               debug(msg);
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

             plugin.onPolicy(p, function(err,result) {
               assert.equal(err, undefined, err ? " err " : " no err");
               assert.equal(
                 result,
                 assertion,
                 result
                   ? "warning/error was returned"
                   : "warning/error was not returned"
               );
             });
           }
          );
      };

//now generate a full report and check the format of the report
/*
test(
  `<JSONThreatProtection async="false" continueOnError="false" enabled="true" name="JSON-Threat-Protection-1">
   <DisplayName>JSON Threat Protection 1</DisplayName>
   <ArrayElementCount>20</ArrayElementCount>
   <ContainerDepth>10</ContainerDepth>
   <ObjectEntryCount>15</ObjectEntryCount>
   <ObjectEntryNameLength>50</ObjectEntryNameLength>
   <Source>request</Source>
   <StringValueLength>500</StringValueLength>
</JSONThreatProtection>`,
  null,
  null,
  false //not attached
);
*/

describe(`${testID} - ${plugin.plugin.name}`, function() {

  test(
    1,
    `<JSONThreatProtection async="false" continueOnError="false" enabled="true" name="JSON-Threat-Protection-1">
     <DisplayName>JSON Threat Protection 1</DisplayName>
     <ArrayElementCount>20</ArrayElementCount>
     <ContainerDepth>10</ContainerDepth>
     <ObjectEntryCount>15</ObjectEntryCount>
     <ObjectEntryNameLength>50</ObjectEntryNameLength>
     <Source>request</Source>
     <StringValueLength>500</StringValueLength>
  </JSONThreatProtection>`,
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name>JSON-Threat-Protection-1</Name>
  </Step>`,
    null,
    false //attached good condition
  );

});
/*
test(
  `<JSONThreatProtection async="false" continueOnError="false" enabled="true" name="JSON-Threat-Protection-1">
   <DisplayName>JSON Threat Protection 1</DisplayName>
   <ArrayElementCount>20</ArrayElementCount>
   <ContainerDepth>10</ContainerDepth>
   <ObjectEntryCount>15</ObjectEntryCount>
   <ObjectEntryNameLength>50</ObjectEntryNameLength>
   <Source>request</Source>
   <StringValueLength>500</StringValueLength>
</JSONThreatProtection>`,
  `<Step>
    <Condition>foo != ""</Condition>
    <Name>JSON-Threat-Protection-1</Name>
</Step>`,
  null,
  true //attached insufficient condition
);

test(
  `<JSONThreatProtection async="false" continueOnError="false" enabled="true" name="JSON-Threat-Protection-1">
   <DisplayName>JSON Threat Protection 1</DisplayName>
   <ArrayElementCount>20</ArrayElementCount>
   <ContainerDepth>10</ContainerDepth>
   <ObjectEntryCount>15</ObjectEntryCount>
   <ObjectEntryNameLength>50</ObjectEntryNameLength>
   <Source>request</Source>
   <StringValueLength>500</StringValueLength>
</JSONThreatProtection>`,
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
  `<JSONThreatProtection async="false" continueOnError="false" enabled="true" name="JSON-Threat-Protection-1">
   <DisplayName>JSON Threat Protection 1</DisplayName>
   <ArrayElementCount>20</ArrayElementCount>
   <ContainerDepth>10</ContainerDepth>
   <ObjectEntryCount>15</ObjectEntryCount>
   <ObjectEntryNameLength>50</ObjectEntryNameLength>
   <Source>request</Source>
   <StringValueLength>500</StringValueLength>
</JSONThreatProtection>`,
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
  '<RegularExpressionProtection async="false" continueOnError="false" enabled="true" name="regExLookAround"><DisplayName>regExLookAround</DisplayName><Source>request</Source><IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables><URIPath><Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern></URIPath></RegularExpressionProtection>',
  null,
  null,
  false //not extractVar
);

describe("testing " + testPN, function() {
  var configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: "/Users/davidwallen/Projects/CSDataProxy/apiproxy"
      }
    },
    Bundle = require("../../lib/package/Bundle.js"),
    util = require("util"),
    bl = require("../../lib/package/bundleLinter.js");

  debug("test configuration: " + JSON.stringify(configuration));

  var bundle = new Bundle(configuration);
  bl.executePlugin(testPN, bundle);

  //need a case where we are using ref for the key
  //also prefix

  describe("Print " + testPN + " plugin results", function() {
    var report = bundle.getReport(),
      jsimpl = bl.getFormatter("json.js");

    if (!jsimpl) {
      assert("implementation not defined: " + jsimpl);
    } else {
      it("should create a report object with valid schema", function() {
        var schema = require("./../fixtures/reportSchema.js"),
          Validator = require("jsonschema").Validator,
          v = new Validator(),
          validationResult,
          jsonReport;

        var jsonReport = JSON.parse(jsimpl(bundle.getReport()));
        validationResult = v.validate(jsonReport, schema);
        assert.equal(
          validationResult.errors.length,
          0,
          validationResult.errors
        );
      });
    }
  });

  var stylimpl = bl.getFormatter("unix.js");
  var stylReport = stylimpl(bundle.getReport());
  debug("unix formatted report: \n" + stylReport);
  console.log(stylReport);
});
*/
