var allBundles = require("./multipleBundles.js"),
  assert = require("assert"),
  bl = require("../../lib/package/bundleLinter.js"),
  schema = require("./../fixtures/reportSchema.js"),
  Validator = require("jsonschema").Validator,
  plugin = "policyNameConventions.js";

allBundles(function(bundle, cb) {
  //this will get called in a loop for every proxyFolder
  bl.executePlugin(plugin, bundle, function() {
    it(
      "test" +
        plugin +
        ": should create a report object with valid schema for " +
        bundle.proxyRoot +
        ".",
      function() {
        this.timeout(500);

        var unixImpl = bl.getFormatter("unix.js");

        bundle.getReport(function(report) {
          if (JSON.stringify(report).indexOf("PO007") > 0) {
            console.log(JSON.stringify(report));
          }
        });

        var jsimpl = bl.getFormatter("json.js"),
          v = new Validator(),
          validationResult,
          jsonReport;

        bundle.getReport(function(report) {
          validationResult = v.validate(report, schema);
          assert.equal(
            validationResult.errors.length,
            0,
            validationResult.errors
          );
        });
      }
    );
  });
  if (cb) {
    cb(null, "complete");
  }
});
