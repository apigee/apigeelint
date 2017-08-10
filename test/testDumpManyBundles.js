var assert = require("assert"),
  fs = require("fs"),
  path = require("path"),
  debug = require("debug")("bundlelinter:dumpBundle"),
  FindFolder = require("node-find-folder"),
  Bundle = require("../lib/package/Bundle.js"),
  bl = require("../lib/package/bundleLinter.js"),
  rootDir = "/Users/davidwallen/Projects/",
  cwd = process.cwd();

process.chdir(rootDir);
var folders = new FindFolder("apiproxy");
process.chdir(cwd);

folders.forEach(function(folder) {
  var config = {
    debug: true,
    source: {
      type: "filesystem",
      path: rootDir + folder
    },
    formatter: "table.js"
  };
  var bundle = new Bundle(config);
  it("should not blow chunks dumping " + config.source.path, function() {
    debug(bundle.summarize());
  });
});
