var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  debug = require("debug")("bundlelinter"),
  Bundle = require("../../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../../lib/package/bundleLinter.js"),
  bundle;

debug("test configuration: " + JSON.stringify(configuration));
bundle = new Bundle(configuration);

var formatters = [
  "checkstyle.js",
  "codeframe.js",
  "compact.js",
  "html.js",
  "jslint-xml.js",
  "json.js",
  "junit.js",
  "stylish.js",
  "table.js",
  "tap.js",
  "unix.js",
  "visualstudio.js"
];

formatters.forEach(function(formatter) {
  describe(formatter, function() {
    describe("getting implementation", function() {
      it("implementation should not be undefined", function() {
        var impl = bl.getFormatter(formatter);
        if (!impl) {
          assert("implementation not defined: " + impl);
        } else {
          var report = impl(
            bundle.getReport(debug("unix formatted report: \n" + report))
          );
        }
      });
    });
  });
});
