var assert = require("assert"),
  fs = require("fs"),
  path = require("path"),
  schema = require("./reportSchema.js"),
  Validator = require("jsonschema").Validator,
  pluginPath = path.join(__dirname, "../lib/package/plugins"),
  plugins = [],
  cwd = process.cwd(),
  async = require("async");

fs.readdirSync(pluginPath).forEach(function(file) {
  plugins.push(file);
});

var FindFolder = require("node-find-folder"),
  path = require("path"),
  Bundle = require("../lib/package/Bundle.js"),
  bl = require("../lib/package/bundleLinter.js"),
  rootDir = "/Users/davidwallen/Projects/";

process.chdir(rootDir);
var folders = new FindFolder("apiproxy");
process.chdir(cwd);

async.everySeries(
  folders,
  function(folder, cb) {
    var config = {
      debug: true,
      source: {
        type: "filesystem",
        path: rootDir + folder
      },
      formatter: "table.js"
    };
    var bundle = new Bundle(config);

    plugins.forEach(function(plugin) {
      console.log("executing " + plugin);
      bl.executePlugin(plugin, bundle, function() {
        it(
          "testAllPluginsMultpleBundlesReportSchema: " +
            plugin +
            " should create a report object with valid schema for " +
            folder +
            ".",
          function() {
            this.timeout(500);

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
    });
    console.log("finished " + folder);
    cb(null, true);
  },
  function(err,result) {
   console.log(result);
  }
);
