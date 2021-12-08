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
/* global describe, it, configuration */

const assert = require("assert"),
      testID = "PO003",
      debug = require("debug")("apigeelint:" + testID),
      Bundle = require("../../lib/package/Bundle.js"),
      bl = require("../../lib/package/bundleLinter.js"),
      Policy = require("../../lib/package/Policy.js"),
      Step = require("../../lib/package/Step.js"),
      Flow = require("../../lib/package/Flow.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Dom = require("@xmldom/xmldom").DOMParser,
      test = function(caseNum, exp, stepExp, flowExp, assertion) {
        it(`test case ${caseNum}, expected(${assertion})`,
           function() {
             var pDoc = new Dom().parseFromString(exp),
                 sDoc,
                 fDoc,
                 p = new Policy(pDoc, this),
                 s,
                 f;

             let origAddMessage = p.addMessage;
             p.addMessage = function(msg) {
               //debug(msg);
               origAddMessage.call(p, msg);
             };

             p.getElement = function() {
               return pDoc;
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


/*
*/
const policyXml1 = `<ExtractVariables name="ExtractVariables-4">
     <Source>response</Source>
     <JSONPayload>
        <Variable name="latitude" type="float">
           <JSONPath>$.results[0].geometry.location.lat</JSONPath>
        </Variable>
        <Variable name="longitude" type="float">
           <JSONPath>$.results[0].geometry.location.lng</JSONPath>
        </Variable>
     </JSONPayload>
     <FormParam name="greeting">
        <Pattern>hello {user}</Pattern>
     </FormParam>
     <VariablePrefix>geocoderesponse</VariablePrefix>
  </ExtractVariables>`;

const policyXml2 = `<ExtractVariables name="ExtractVariables-2">
   <Source>scResponse</Source>
   <XMLPayload>
     <Namespaces>
       <Namespace prefix='soap'>http://schemas.xmlsoap.org/soap/envelope/</Namespace>
     </Namespaces>
     <Variable name='topLevelResponseElement' type='string'>
       <XPath>local-name(/soap:Envelope/soap:Body/*[1])</XPath>
     </Variable>
   </XMLPayload>
   <VariablePrefix>soapresponse</VariablePrefix>
</ExtractVariables>`;


describe(`${testID} - ${plugin.plugin.name}`, function() {

  test(
    1,
    policyXml1,
    null,
    null,
    false //not attached
  );

  test(
    2,
    policyXml1,
    `<Step>
      <Condition>foo != ""</Condition>
      <Name>ExtractVariables-4</Name>
  </Step>`,
    null,
    true //attached insufficient condition
  );


  test(
    3,
    policyXml2,
    `<Step>
      <Condition>foo != ""</Condition>
      <Name>ExtractVariables-4</Name>
  </Step>`,
    null,
    false // attached, insufficient condition, but not JSONPayload
  );

  test(
    4,
    policyXml1,
    `<Step>
    <Condition>response.content != ""</Condition>
    <Name>ExtractVariables-4</Name>
</Step>`,
    null,
    false //attached good condition
  );

  test(
    4,
    policyXml1,
    `<Step>
    <Condition>message.content != ""</Condition>
    <Name>ExtractVariables-4</Name>
</Step>`,
    null,
    true //attached insufficient condition
  );

  test(
    5,
    policyXml1,
    `<Step>
    <Condition>foo != ""</Condition>
    <Name>ExtractVariables-5</Name>
</Step>`,
    `<Flow name="flow2">
        <Step>
            <Condition>foo != ""</Condition>
            <Name>ExtractVariables-5</Name>
        </Step>
        <Condition/>
    </Flow>`,
    true //attached insufficient condition
  );


  test(
    6,
    policyXml1,
    ` <Step>
        <Condition>foo != ""</Condition>
        <Name>ExtractVariables-6</Name>
    </Step>`,
    ` <Flow name="flow2">
        <Step>
            <Condition>foo != ""</Condition>
            <Name>ExtractVariables-6</Name>
        </Step>
        <Condition>response.content != ""</Condition>
    </Flow>`,
    false //attached sufficient condition
  );


  test(
    7,
    `<RegularExpressionProtection name="regExLookAround">
  <DisplayName>regExLookAround</DisplayName>
  <Source>request</Source>
  <IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables>
  <URIPath>
    <Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern>
  </URIPath>
</RegularExpressionProtection>`,
    null,
    null,
    false //not extractVar
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
