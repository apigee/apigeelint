var assert = require("assert"),
  testPN = "checkForEmptySteps.js",
  debug = require("debug")("bundlelinter:" + testPN),
  Step = require("../lib/package/Step.js"),
  plugin = require("../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(stepExp, assertion) {
    it(
      "testing " + testPN + '" expected to see ' + assertion + ".",
      function() {
        var sDoc = new Dom().parseFromString(stepExp);
        step = new Step(sDoc, this);
        step.addMessage = function(msg) {
          debug(msg);
        };

        plugin.onStep(step, function(result) {
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

test(
  `<Step>
    <Condition>message.content != ""</Condition>
    <Name>ExtractVariables-4</Name>
</Step>`,
  false
);

test(
  `<Step>
    <Condition>message.content != ""</Condition>
    <Name></Name>
</Step>`,
  true
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
});
