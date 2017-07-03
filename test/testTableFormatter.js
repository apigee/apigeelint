var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  debug = require("debug")("bundlelinter"),
  Bundle = require("../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../lib/package/bundleLinter.js"),
  configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: "./test/sampleProxy/24Solver/apiproxy/"
    },
    formatter: "table.js"
  };

debug("test configuration: " + JSON.stringify(configuration));
bl.lint(configuration);