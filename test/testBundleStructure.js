var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  pName = "checkBundleStructure",
  debug = require("debug")("bundlelinter:" + pName),
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

describe("Print bundle structure results", function() {
  bl.executePlugin(pName, bundle);

  var impl = bl.getFormatter("unix.js");
  if (!impl) {
    assert("implementation not defined: " + impl);
  } else {
    var report = impl(bundle.getReport());
    debug("unix formatted report: \n" + report);
  }
});

it("should create a report object with valid schema", function() {
  var schema = require("./reportSchema.js"),
    Validator = require("jsonschema").Validator,
    jsimpl = bl.getFormatter("json.js"),
    v = new Validator(),
    validationResult,
    jsonReport;

  var jsonReport = JSON.parse(jsimpl(bundle.getReport()));
  validationResult = v.validate(jsonReport, schema);
  assert.equal(validationResult.errors.length, 0, validationResult.errors);
});
