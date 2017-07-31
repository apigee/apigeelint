var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  testPN = "threatProtectionJSONConditionCheck.js",
  debug = require("debug")("bundlelinter:" + testPN),
  Bundle = require("../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../lib/package/bundleLinter.js");

var Policy = require("../lib/package/Policy.js"),
  Step = require("../lib/package/Step.js"),
  Flow = require("../lib/package/Flow.js"),
  plugin = require("../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(exp, stepExp, flowExp, assertion) {
    it(
      "testing " + testPN + '" expected to see ' + assertion + ".",
      function() {
        var pDoc = new Dom().parseFromString(exp),
          sDoc,
          fDoc,
          p = new Policy(pDoc, this),
          s,
          f;

        p.addMessage = function(msg) {
          debug(msg);
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
          f = new Flow(fDoc, null);
        }

        if (stepExp) {
          sDoc = new Dom().parseFromString(stepExp);
          s = new Step(sDoc, f);
        }

        plugin.onPolicy(p, function(result) {
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
    <Condition>message.content != ""</Condition>
    <Name>JSON-Threat-Protection-1</Name>
</Step>`,
  null,
  false //attached good condition
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
        path: "./test/sampleProxy/24Solver/apiproxy"
      }
    },
    Bundle = require("../lib/package/Bundle.js"),
    util = require("util"),
    bl = require("../lib/package/bundleLinter.js");

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
        var schema = require("./reportSchema.js"),
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
