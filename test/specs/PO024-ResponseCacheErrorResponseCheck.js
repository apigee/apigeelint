/*
  Copyright 2019-2025 Google LLC

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
/* global it, describe */

const assert = require("node:assert"),
  testID = "PO024",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  Policy = require("../../lib/package/Policy.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Dom = require("@xmldom/xmldom").DOMParser,
  test = function (caseNum, exp, assertion) {
    it(`tests case ${caseNum}, expect(${assertion})`, function () {
      let doc = new Dom().parseFromString(exp),
        p = new Policy("/", "fakename", this, doc);

      p.addMessage = function (msg) {
        debug(msg);
      };
      p.getElement = function () {
        return doc;
      };
      plugin.onPolicy(p, function (err, result) {
        assert.equal(err, undefined, err ? " err " : " no err");
        assert.equal(
          result,
          assertion,
          result
            ? "warning/error was returned"
            : "warning/error was not returned",
        );
      });
    });
  };

//now generate a full report and check the format of the report

describe(`${testID} - ${plugin.plugin.name}`, function () {
  test(
    1,
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
  </ResponseCache>`,
    true,
  );
  test(
    2,
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
      <ExcludeErrorResponse>false</ExcludeErrorResponse>
  </ResponseCache>`,
    true,
  );
  test(
    3,
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
      <ExcludeErrorResponse/>
  </ResponseCache>`,
    true,
  );
  test(
    4,
    `<ResponseCache name="ResponseCache">
      <CacheKey>
          <KeyFragment ref="request.queryparam.w" />
      </CacheKey>
      <ExpirySettings>
          <TimeoutInSec>600</TimeoutInSec>
      </ExpirySettings>
      <ExcludeErrorResponse>true</ExcludeErrorResponse>
  </ResponseCache>`,
    false,
  );
  test(
    5,
    '<RegularExpressionProtection async="false" continueOnError="false" enabled="true" name="regExLookAround"><DisplayName>regExLookAround</DisplayName><Source>request</Source><IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables><URIPath><Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern></URIPath></RegularExpressionProtection>',
    false,
  );

  describe(`Print plugin results (${testID})`, function () {
    it("should create a report object with valid schema", function () {
      debug("test configuration: " + JSON.stringify(configuration));

      var bundle = new Bundle(configuration);
      bl.executePlugin(testID, bundle);

      //need a case where we are using ref for the key
      //also prefix
      let report = bundle.getReport();
      assert.ok(report);
      let formatter = bl.getFormatter("json.js");
      assert.ok(formatter);

      let schema = require("./../fixtures/reportSchema.js"),
        Validator = require("jsonschema").Validator,
        v = new Validator(),
        jsonReport = JSON.parse(formatter(bundle.getReport())),
        validationResult = v.validate(jsonReport, schema);
      assert.equal(validationResult.errors.length, 0, validationResult.errors);

      let stylimpl = bl.getFormatter("unix.js");
      assert.ok(stylimpl);
      let stylReport = stylimpl(bundle.getReport());
      assert.ok(stylReport);
      debug("unix formatted report: \n" + stylReport);
    });
  });
});
