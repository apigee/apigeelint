/*
  Copyright 2019 Google LLC

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

var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  testPN = "extractFormParamConditionCheck.js",
  debug = require("debug")("apigeelint:" + testPN),
  Bundle = require("../../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../../lib/package/bundleLinter.js");

var Policy = require("../../lib/package/Policy.js"),
  Step = require("../../lib/package/Step.js"),
  Flow = require("../../lib/package/Flow.js"),
  plugin = require("../../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(exp, stepExp, flowExp, assertion) {
    it(
      "testing " + testPN + '" expected to see ' + assertion + ".",
      function() {
        var pDoc = new Dom().parseFromString(exp),
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

        plugin.onPolicy(p, function(err, result) {
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

describe("testing " + testPN, function() {
  test(
    `<ExtractVariables name="ExtractVariables-1">
     <Source>response</Source>
     <JSONPayload>
        <Variable name="latitude" type="float">
           <JSONPath>$.results[0].geometry.location.lat</JSONPath>
        </Variable>
        <Variable name="longitude" type="float">
           <JSONPath>$.results[0].geometry.location.lng</JSONPath>
        </Variable>
     </JSONPayload>
     <VariablePrefix>geocoderesponse</VariablePrefix>
  </ExtractVariables>`,
    null,
    null,
    false //not attached
  );
  test(
    `<ExtractVariables name="ExtractVariables-2">
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
    null,
    null,
    false //not attached
  );

  test(
    `<ExtractVariables name="ExtractVariables-3">
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
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name>ExtractVariables-4</Name>
  </Step>`,
    null,
    false //attached good condition
  );

  test(
    `<ExtractVariables name="ExtractVariables-4">
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
    `<Step>
      <Condition>foo != ""</Condition>
      <Name>ExtractVariables-4</Name>
  </Step>`,
    null,
    true //attached insufficient condition
  );

  test(
    `<ExtractVariables name="ExtractVariables-5">
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
    `<ExtractVariables name="ExtractVariables-6">
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
    ` <Step>
          <Condition>foo != ""</Condition>
          <Name>ExtractVariables-6</Name>
      </Step>`,
    ` <Flow name="flow2">
          <Step>
              <Condition>foo != ""</Condition>
              <Name>ExtractVariables-6</Name>
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


  var Bundle = require("../../lib/package/Bundle.js"),
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
});
