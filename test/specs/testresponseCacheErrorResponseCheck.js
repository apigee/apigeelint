/*
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  testPN = "responseCacheErrorResponseCheck.js",
  debug = require("debug")("bundlelinter:" + testPN),
  Bundle = require("../../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../../lib/package/bundleLinter.js");

var Policy = require("../../lib/package/Policy.js"),
  plugin = require("../../lib/package/plugins/" + testPN),
  Dom = require("xmldom").DOMParser,
  test = function(exp, assertion) {
    it(
      "testing " +
        testPN +
        ' with "' +
        exp +
        '" expected to see ' +
        assertion +
        ".",
      function() {
        var doc = new Dom().parseFromString(exp);
        var p = new Policy(doc, this);

        p.addMessage = function(msg) {
          debug(msg);
        };
        p.getElement = function() {
          return doc;
        };
        plugin.onPolicy(p, function(err, result) {
          assert.equal(err, undefined, err ? " err " : " no err");
          assert.equal(
            result,
            assertion,
            result
              ? "warning/error was returned"
              : "warning/error was not returned"
          );
        });
      }
    );
  };

//now generate a full report and check the format of the report


describe("testing " + testPN, function() {

  test(
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
  </ResponseCache>`,
    true
  );
  test(
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
      <ExcludeErrorResponse>false</ExcludeErrorResponse>
  </ResponseCache>`,
    true
  );
  test(
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
      <ExcludeErrorResponse/>
  </ResponseCache>`,
    true
  );
  test(
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
      <ExcludeErrorResponse>true</ExcludeErrorResponse>
  </ResponseCache>`,
    false
  );
  test(
    '<RegularExpressionProtection async="false" continueOnError="false" enabled="true" name="regExLookAround"><DisplayName>regExLookAround</DisplayName><Source>request</Source><IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables><URIPath><Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern></URIPath></RegularExpressionProtection>',
    false
  );


  var Bundle = require("../../lib/package/Bundle.js"),
    util = require("util"),
    bl = require("../../lib/package/bundleLinter.js");

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
        var schema = require("./../fixtures/reportSchema.js"),
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
});
