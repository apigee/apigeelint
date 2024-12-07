/*
  Copyright 2019-2024 Google LLC

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

const assert = require("assert"),
  testID = "PO022",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  Policy = require("../../lib/package/Policy.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Dom = require("@xmldom/xmldom").DOMParser,
  test = function (exp, caseNum, assertion) {
    it(`tests ${caseNum}, expect(${assertion})`, function () {
      let doc = new Dom().parseFromString(exp),
        p = new Policy("/", "fakename.xml", this, doc);

      p.addMessage = function (msg) {
        debug(msg);
      };
      p.getElement = function () {
        return doc;
      };
      plugin.onPolicy(p, function (e, result) {
        assert.equal(e, undefined, e ? " error " : " no error");
        assert.equal(
          result,
          assertion,
          result ? "  distirbuted is true " : "distirbuted is true not found",
        );
      });
    });
  };

describe(`${testID} - ${plugin.plugin.name}`, function () {
  test(
    `<Quota name="CheckQuota">
  <Interval ref="verifyapikey.verify-api-key.apiproduct.developer.quota.interval">1</Interval>
  <TimeUnit ref="verifyapikey.verify-api-key.apiproduct.developer.quota.timeunit">hour</TimeUnit>
  <Allow count="200" countRef="verifyapikey.verify-api-key.apiproduct.developer.quota.limit"/>
</Quota>`,
    1,
    true,
  );

  test(
    `<Quota name="CheckQuota">
  <Distributed>false</Distributed>
  <Interval ref="verifyapikey.verify-api-key.apiproduct.developer.quota.interval">1</Interval>
  <TimeUnit ref="verifyapikey.verify-api-key.apiproduct.developer.quota.timeunit">hour</TimeUnit>
  <Allow count="200" countRef="verifyapikey.verify-api-key.apiproduct.developer.quota.limit"/>
</Quota>`,
    2,
    true,
  );

  test(
    `<Quota name="CheckQuota">
  <Distributed>true</Distributed>
  <Interval ref="verifyapikey.verify-api-key.apiproduct.developer.quota.interval">1</Interval>
  <TimeUnit ref="verifyapikey.verify-api-key.apiproduct.developer.quota.timeunit">hour</TimeUnit>
  <Allow count="200" countRef="verifyapikey.verify-api-key.apiproduct.developer.quota.limit"/>
</Quota>`,
    3,
    false,
  );

  test(
    `<RegularExpressionProtection name="regExLookAround">
  <DisplayName>regExLookAround</DisplayName>
  <Source>request</Source>
  <IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables>
  <URIPath>
    <Pattern>(?/(@?[w_?w:*]+([[^]]+])*)?)+</Pattern>
  </URIPath>
</RegularExpressionProtection>`,
    4,
    false,
  );
});

describe(`${testID} - Print plugin results`, function () {
  debug("test configuration: " + JSON.stringify(configuration));
  var bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);
  let report = bundle.getReport();

  it("should create a report object with valid schema", function () {
    let formatter = bl.getFormatter("json.js");
    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }
    let schema = require("./../fixtures/reportSchema.js"),
      Validator = require("jsonschema").Validator,
      v = new Validator(),
      jsonReport = JSON.parse(formatter(report)),
      validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  });
});
