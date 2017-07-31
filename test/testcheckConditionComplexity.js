var assert = require("assert"),
  testPN = "checkConditionComplexity.js",
  debug = require("debug")("bundlelinter:" + testPN),
  Condition = require("../lib/package/Condition.js"),
  plugin = require("../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(exp, assertion) {
    it(
      'testing condition complexity of "' +
        exp +
        '" expected to see ' +
        assertion +
        ".",
      function() {
        var doc = new Dom().parseFromString(exp);
        var c = new Condition(doc, this),
          result;

        c.addMessage = function(msg) {
          debug(msg);
        };
        plugin.onCondition(c, function(result) {
          assert.equal(
            result,
            assertion,
            result ? " literal found " : "literal not found"
          );
        });
      }
    );
  };

test("false", 1);
test("true OR false", 3);
test("b = c AND true", 5);
test("b OR c AND (a OR B AND C or D and True)", 13);

//now generate a full report and check the format of the report

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
