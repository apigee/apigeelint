/*
  Copyright 2019-2021,2025 Google LLC

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
/* global describe, it */

const assert = require("assert"),
  testID = "TD001",
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  Endpoint = require("../../lib/package/Endpoint.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Dom = require("@xmldom/xmldom").DOMParser,
  test = function (caseNum, targetDef, assertion) {
    it(`tests case ${caseNum}, expect(${assertion}`, function () {
      let tDoc = new Dom().parseFromString(targetDef),
        target = new Endpoint(tDoc, this, "");

      target.addMessage = function (msg) {
        debug(msg);
      };

      plugin.onTargetEndpoint(target, function (err, result) {
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
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties>
        <Property name="supports.http10">true</Property>
        <Property name="request.retain.headers">User-Agent,Referer,Accept-Language</Property>
        <Property name="retain.queryparams">apikey</Property>
      </Properties>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    false,
  );

  test(
    2,
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <URL>https://api.enterprise.apigee.com/v1/organizations/{org_name}/apis/{api_name}/maskconfigs</URL>
      <Properties>
        <Property name="supports.http10">true</Property>
        <Property name="request.retain.headers">User-Agent,Referer,Accept-Language</Property>
        <Property name="retain.queryparams">apikey</Property>
      </Properties>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    true,
  );
});

describe(`${testID} - Print plugin results`, function () {
  it("should create a report object with valid schema", function () {
    debug("test configuration: " + JSON.stringify(configuration));
    var bundle = new Bundle(configuration);
    bl.executePlugin(testID, bundle);
    let report = bundle.getReport();

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
