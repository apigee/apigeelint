var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  debug = require("debug")("bundlelinter"),
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
bl.executePlugin("checkUnattachedPolicies.js", bundle, function() {
  describe("Check for unattached policies", function() {
    var report = bundle.getReport(bundle),
      unattachedFiles = [
        "ExtractVariables.xml",
        "ExtractVariables_1.xml",
        "ExtractVariables_unattached.xml",
        "badServiceCallout.xml",
        "jsCalculate.xml"
      ];

    for (var j = 0; j < unattachedFiles.length; j++) {
      var file = unattachedFiles[j];
      it("should mark " + file + " as unattached", function() {
        var found = false;
        for (var i = 0; i < report.length && !found; i++) {
          var reportObj = report[i];
          if (reportObj.filePath.endsWith(file)) {
            reportObj.messages.some(function(msg) {
              if (msg.ruleId === "BN005") {
                found = true;
              }
            });
          }
        }
        assert.equal(found, true);
      });
    }
  });
});
