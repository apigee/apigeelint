var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  testPN = "checkForEmptySteps",
  debug = require("debug")("bundlelinter:" + testPN),
  Bundle = require("../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../lib/package/bundleLinter.js"),
  configuration = {
    debug: false,
    source: {
      type: "filesystem",
      path: "./test/sampleProxy/24Solver/apiproxy"
    }
  };

debug("test configuration: " + JSON.stringify(configuration));
var bundle = new Bundle(configuration);
  bl.executePlugin(testPN, bundle);


describe("Print " + testPN + " plugin results", function() {
  var report=bundle.getReport();
  var jsimpl = bl.getFormatter("json.js");

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
      assert.equal(validationResult.errors.length, 0, validationResult.errors);
    });
  }
});

var stylimpl = bl.getFormatter("table.js");
var stylReport=stylimpl(bundle.getReport());
debug("table formatted report: \n" + stylReport);
console.log(stylReport);