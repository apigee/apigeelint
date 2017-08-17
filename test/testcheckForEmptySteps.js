var assert = require("assert"),
  testPN = "checkForEmptySteps.js",
  debug = require("debug")("bundlelinter:" + testPN),
  Step = require("../lib/package/Step.js"),
  plugin = require("../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(stepExp, assertion) {
    it("testing " + testPN + " expected to see " + assertion + ".", function() {
      var sDoc = new Dom().parseFromString(stepExp);
      this.getLines = function() {
        return stepExp;
      };
      step = new Step(sDoc.documentElement, this);
      step.addMessage = function(msg) {
        debug(msg);
      };

      plugin.onStep(step, function(err, result) {
         assert.equal(
            err,
            undefined,
            err ? " err " : " no err"
          );
        assert.equal(
          result,
          assertion,
          result
            ? "warning/error was returned"
            : "warning/error was not returned"
        );
      });
    });
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

test(
  `
            <Step>
                <Name>jsonThreatProtection</Name>
                <Condition>request.verb != "GET"</Condition>
            </Step>
`,
  false
);

var config = {
    debug: true,
    source: {
      type: "filesystem",
      path: "/Users/davidwallen/Projects/CSDataProxy/apiproxy"
    },
    formatter: "table.js"
  },
  Bundle = require("../lib/package/Bundle.js"),
  bl = require("../lib/package/bundleLinter.js"),
  Validator = require("jsonschema").Validator,
  schema = require("./reportSchema.js");

var bundle = new Bundle(config);

bl.executePlugin(testPN, bundle);
it(
  testPN +
    " should create a report object with valid schema for " +
    config.source.path +
    ".",
  function() {
    var jsimpl = bl.getFormatter("json.js"),
      v = new Validator(),
      validationResult,
      jsonReport;

    var jsonReport = JSON.parse(jsimpl(bundle.getReport()));
    validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  }
);
