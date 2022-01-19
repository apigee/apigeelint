/*
  Copyright 2019-2022 Google LLC

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

const policyXml = {
        test1: `<ExtractVariables name="EV-test1">
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
  </ExtractVariables>`,
        test2: `<ExtractVariables name="EV-test2">
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
</ExtractVariables>`,
        test3 : `<ExtractVariables name="EV-test3">
   <Source>private.geis.kvm.api.config</Source>
     <JSONPayload>
        <Variable name="location" type="string">
           <JSONPath>$.targets.location</JSONPath>
        </Variable>
     </JSONPayload>
   <VariablePrefix>config</VariablePrefix>
</ExtractVariables>`,
        test4: `<RegularExpressionProtection name="REP-1">
  <Source>request</Source>
  <IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables>
  <URIPath>
    <Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern>
  </URIPath>
</RegularExpressionProtection>`
      };

describe(`${testID} - ${plugin.plugin.name}`, function() {

  test(
    10,
    policyXml.test1,
    null,
    null,
    false //not attached
  );

  test(
    20,
    policyXml.test1,
    `<Step>
      <Condition>foo != ""</Condition>
      <Name>EV--Policy-Name-Does-Not-Matter</Name>
  </Step>`,
    null,
    true // attached insufficient condition
  );

  test(
    30,
    policyXml.test2,
    `<Step>
      <Condition>foo != ""</Condition>
      <Name>EV--Policy-Name-Does-Not-Matter</Name>
  </Step>`,
    null,
    false // attached, insufficient condition, but not JSONPayload
  );

  test(
    40,
    policyXml.test1,
    `<Step>
    <Condition>response.content != ""</Condition>
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    false //attached, sufficient condition
  );

  test(
    41,
    policyXml.test1,
    `<Step>
    <Condition> response.content   !=""</Condition> <!-- with spaces -->
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    false //attached, sufficient condition
  );

  test(
    42,
    policyXml.test1,
    `<Step>
    <Condition>(response.content !=null) and (response.status.code !="401" )</Condition> <!-- compound condition -->
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    false //attached, sufficient condition
  );

  test(
    50,
    policyXml.test1,
    `<Step>
    <Condition>(response.content != "")</Condition> <!-- wrapped in parens -->
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    false //attached, sufficient condition with parenthesis
  );

  test(
    51,
    policyXml.test1,
    `<Step>
    <Condition>( response.content != "")</Condition> <!-- extra leading space -->
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    false //attached, sufficient condition with parenthesis
  );

  test(
    52,
    policyXml.test1,
    `<Step>
    <Condition> ( response.content != "") </Condition> <!-- leading and trailing spaces -->
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    false //attached, sufficient condition
  );

  test(
    53,
    policyXml.test1,
    `<Step>
    <Condition> ( response.content !=""   ) </Condition> <!-- leading and trailing spaces -->
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    false //attached, sufficient condition
  );

  test(
    60,
    policyXml.test1,
    `<Step>
    <Condition>message.content != ""</Condition>
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    null,
    true //attached insufficient condition. condition var does not match policy.
  );

  test(
    70,
    policyXml.test1,
    `<Step>
    <Condition>foo != ""</Condition>
    <Name>EV--Policy-Name-Does-Not-Matter</Name>
</Step>`,
    `<Flow name="flow2">
        <Step>
          <Condition>foo != ""</Condition>
          <Name>EV--Policy-Name-Does-Not-Matter</Name>
        </Step>
        <Condition/>
    </Flow>`,
    true //attached insufficient condition
  );

  test(
    80,
    policyXml.test1,
    ` <Step>
        <Condition>foo != ""</Condition>
        <Name>EV--Policy-Name-Does-Not-Matter</Name>
    </Step>`,
    ` <Flow name="flow2">
        <Step>
          <Condition>foo != ""</Condition>
          <Name>EV--Policy-Name-Does-Not-Matter</Name>
        </Step>
        <Condition>response.content != ""</Condition>
    </Flow>`,
    false //attached sufficient condition in parent
  );

  test(
    90,
    policyXml.test4,
    null,
    null,
    false //not ExtractVariables
  );

  test(
    100,
    policyXml.test3,
    `<Step>
    <Condition>private.geis.kvm.api.config != ""</Condition>
    <Name>EV-3</Name>
</Step>`,
    null,
    false // attached sufficient condition
  );

  test(
    110,
    policyXml.test3,
    `<Step>
    <Condition>private.geis.kvm.api.config IsNot null</Condition>
    <Name>EV-3</Name>
</Step>`,
    null,
    false //attached sufficient condition
  );

  test(
    120,
    policyXml.test3,
    `<Step>
    <Condition>private.geis.kvm.api != ""</Condition>
    <Name>EV-3</Name>
</Step>`,
    null,
    true //attached insufficient condition
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
