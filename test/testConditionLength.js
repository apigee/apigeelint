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

describe("List long conditions", function() {
  bl.executePlugin("checkConditionLength", bundle);
  debug(
    "report: \n" +
      util.inspect(bl.getReport(bundle), {
        showhidden: false,
        depth: 4,
        maxArrayLength: 10
      })
  );
});