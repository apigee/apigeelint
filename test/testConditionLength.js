var assert = require("assert"),
  testPN = "checkConditionForLiterals.js",
  debug = require("debug")("bundlelinter:" + testPN),
  bl = require("../lib/package/bundleLinter.js"),
  configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: "./test/sampleProxy/24Solver/apiproxy"
    }
  },
  Bundle = require("../lib/package/Bundle.js");

debug("test configuration: " + JSON.stringify(configuration));

var bundle = new Bundle(configuration);

describe("testing " + testPN, function() {
  bl.executePlugin(testPN, bundle);

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

var stylimpl = bl.getFormatter("unix.js");
var stylReport = stylimpl(bundle.getReport());
debug("unix formatted report: \n" + stylReport);
console.log(stylReport);
