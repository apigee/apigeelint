var assert = require("assert"),
  debug = require("debug")("bundlelinter"),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js");

debug("test configuration: " + JSON.stringify(configuration));
var bundle = new Bundle(configuration);
bl.executePlugin("checkUnattachedPolicies.js", bundle, function() {
  describe("Check for unattached policies in " + bundle.root, function() {
    bundle.getReport(function(report) {
      var unattachedFiles = [
        "ExtractVariables.xml",
        "ExtractVariables_1.xml",
        "ExtractVariables_unattached.xml",
        "badServiceCallout.xml",
        "jsCalculate.xml"
      ];

      for (var j = 0; j < unattachedFiles.length; j++) {
        var file = unattachedFiles[j];
        it(
          "should mark " +
            file +
            " as unattached in report ",
          function() {
            var found = false;
            for (var i = 0; i < report.length && !found; i++) {
              var reportObj = report[i];
              if (reportObj.filePath.endsWith(file)) {
                reportObj.messages.forEach(function(msg) {
                  if (msg.ruleId === "BN005") {
                    found = true;
                  }
                });
              }
            }
            assert.equal(found, true);
          }
        );
      }
    });
  });
});
