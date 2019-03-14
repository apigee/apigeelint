var assert = require("assert"),
  fs = require("fs"),
  path = require("path"),
  schema = require("./../fixtures/reportSchema.js"),
  Validator = require("jsonschema").Validator,
  pluginPath = path.join(__dirname, "../lib/package/plugins"),
  plugins = [],
  cwd = process.cwd(),
  debug = require("debug")("bundlelinter:tetMultipleBundlesUpload");

fs.readdirSync(pluginPath).forEach(function(file) {
  plugins.push(file);
});

var FindFolder = require("node-find-folder"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  rootDir = "/Users/davidwallen/Projects/samples/";

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
    formatter: "unix.js",
    output: debug,
    apiUpload: {
      destPath: "https://csdata-test.apigee.net/v1/lintresults",
      user: process.env.au,
      password: process.env.as,
      organization: "csdata"
    }
  };
  it(
    "should not blow chunks linting and uploading " + config.source.path,
    function() {
      this.timeout(20000);
      bl.lint(config);
    }
  );
});

Promise.all(folders)
  .then(function() {
    console.log("completed)");
  })
  .catch(console.error);
