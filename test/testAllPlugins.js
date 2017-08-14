var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  debug = require("debug")("bundlelinter:allplugins"),
  Bundle = require("../lib/package/Bundle.js"),
  Validator = require("jsonschema").Validator,
  util = require("util"),
  bl = require("../lib/package/bundleLinter.js"),
  configuration = {
    debug: false,
    source: {
      type: "filesystem",
      path: path.join(__dirname, "./sampleProxy/24Solver/apiproxy")
    }
  };

var normalizedPath = path.join(__dirname, "../lib/package/plugins");
fs.readdirSync(normalizedPath).forEach(function(file) {
  //is this a js file
  if (file.endsWith(".js")) {
    var bundle = new Bundle(configuration);
    bl.executePlugin(file, bundle);

    it(file + " should create a report object with valid schema.", function() {
      var schema = require("./reportSchema.js"),
        jsimpl = bl.getFormatter("json.js"),
        v = new Validator(),
        validationResult,
        jsonReport;

      bundle.getReport(function(report) {
        var jsonReport = JSON.parse(jsimpl(report));
        validationResult = v.validate(jsonReport, schema);
        assert.equal(
          validationResult.errors.length,
          0,
          validationResult.errors
        );
      });
    });

    it(
      file + " should include a plugin definition with a valid schema.",
      function() {
        var pluginSchema = require("./pluginSchema.js"),
          v = new Validator(),
          plugin = require("../lib/package/plugins/" + file),
          validationResult;

        assert.notEqual(plugin.plugin, null, "plugin is null on " + file);

        validationResult = v.validate(plugin.plugin, pluginSchema);
        assert.equal(
          validationResult.errors.length,
          0,
          validationResult.errors
        );
      }
    );

    it(file + " should have a unique ruleId.", function() {
      var plugin = require("../lib/package/plugins/" + file),
        ids = {};
      //already existists
      if (ids[plugin.plugin.ruleId]) {
        assert.equal(
          file,
          ids[plugin.plugn.ruleId],
          file +
            " and" +
            ids[plugin.plugn.ruleId] +
            " have conflicting ruleIds."
        );
      } else {
        ids[plugin.plugin.ruleId] = file;
      }
    });
  }
});
