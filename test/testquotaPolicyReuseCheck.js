var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  testPN = "quotaPolicyReuseCheck.js",
  debug = require("debug")("bundlelinter:" + testPN),
  Bundle = require("../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../lib/package/bundleLinter.js");

var Policy = require("../lib/package/Policy.js"),
  plugin = require("../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(exp, stepCt, assertion) {
    it(
      "testing " +
        testPN +
        ' with "' +
        exp +
        '" expected to see ' +
        assertion +
        ".",
      function() {
        var doc = new Dom().parseFromString(exp),
          p = new Policy(doc.documentElement, this);

        p.addMessage = function(msg) {
          debug(msg);
        };
        p.getElement = function() {
          return doc.documentElement;
        };
        p.getSteps = function() {
          //create an array with stepCt elements
          var r = [];
          for (var i = 0; i < stepCt; i++) {
            r.push({});
          }
          return r;
        };
        plugin.onPolicy(p, function(err, result) {
          assert.equal(err, undefined, err ? " err " : " no err");
          assert.equal(
            result,
            assertion,
            result
              ? "  steps attached is greater than 1 "
              : "stes attached is 0 or 1"
          );
        });
      }
    );
  };

//now generate a full report and check the format of the report
test(
  '<Quota name="CheckQuota"> <Interval ref="verifyapikey.verify-api-key.apiproduct.developer.quota.interval">1</Interval><TimeUnit ref="verifyapikey.verify-api-key.apiproduct.developer.quota.timeunit">hour</TimeUnit><Allow count="200" countRef="verifyapikey.verify-api-key.apiproduct.developer.quota.limit"/></Quota>',
  1,
  false
);
test(
  '<Quota name="CheckQuota"> <Distributed>false</Distributed><Interval ref="verifyapikey.verify-api-key.apiproduct.developer.quota.interval">1</Interval><TimeUnit ref="verifyapikey.verify-api-key.apiproduct.developer.quota.timeunit">hour</TimeUnit><Allow count="200" countRef="verifyapikey.verify-api-key.apiproduct.developer.quota.limit"/></Quota>',
  2,
  true
);
test(
  '<Quota name="CheckQuota"> <Distributed>true</Distributed><Interval ref="verifyapikey.verify-api-key.apiproduct.developer.quota.interval">1</Interval><TimeUnit ref="verifyapikey.verify-api-key.apiproduct.developer.quota.timeunit">hour</TimeUnit><Allow count="200" countRef="verifyapikey.verify-api-key.apiproduct.developer.quota.limit"/></Quota>',
  1,
  false
);
test(
  '<RegularExpressionProtection async="false" continueOnError="false" enabled="true" name="regExLookAround"><DisplayName>regExLookAround</DisplayName><Source>request</Source><IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables><URIPath><Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern></URIPath></RegularExpressionProtection>',
  1,
  false
);

describe("testing " + testPN, function() {
  var configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: "./test/sampleProxy/24Solver/apiproxy"
      }
    },
    Bundle = require("../lib/package/Bundle.js"),
    util = require("util"),
    bl = require("../lib/package/bundleLinter.js");

  debug("test configuration: " + JSON.stringify(configuration));

  var bundle = new Bundle(configuration);
  bl.executePlugin(testPN, bundle);

  //need a case where we are using ref for the key
  //also prefix

  describe("Print " + testPN + " plugin results", function() {
    var report = bundle.getReport(),
      jsimpl = bl.getFormatter("json.js");

    if (!jsimpl) {
      assert("implementation not defined: " + jsimpl);
    } else {
      it("should create a report object with valid schema", function() {
        var schema = require("./reportSchema.js"),
          Validator = require("jsonschema").Validator,
          v = new Validator(),
          validationResult,
          jsonReport;

        var jsonReport = JSON.parse(jsimpl(bundle.getReport()));
        validationResult = v.validate(jsonReport, schema);
        assert.equal(
          validationResult.errors.length,
          0,
          validationResult.errors
        );
      });
    }
  });

  var stylimpl = bl.getFormatter("unix.js");
  var stylReport = stylimpl(bundle.getReport());
  debug("unix formatted report: \n" + stylReport);
  console.log(stylReport);
});
