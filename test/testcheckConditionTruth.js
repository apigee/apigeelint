var assert = require("assert"),
  testPN = "checkConditionTruth.js",
  debug = require("debug")("bundlelinter:" + testPN);


// generate a full report and check the format of the report
describe("testing " + testPN, function() {
  var configuration = {
      debug: true,
      source: {
        type: "filesystem",
        //path: "./test/sampleProxy/24Solver/apiproxy"
        path:"/Users/davidwallen/Projects/GitLabRestore/mnt/apigee2/git-data/gitlab-satellites/rewards-network/rewardsnetwork/code/gateway/rewardsnetwork/apiproxy"
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
