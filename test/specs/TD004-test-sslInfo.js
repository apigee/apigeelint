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
/* global describe, it, configuration */

const assert = require("assert"),
  testID = "TD004",
  util = require("util"),
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  Endpoint = require("../../lib/package/Endpoint.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Dom = require("@xmldom/xmldom").DOMParser,
  testBase = function (caseNum, profile, desc, targetDef, messages) {
    it(`case ${caseNum} ${desc}`, function () {
      const tDoc = new Dom().parseFromString(targetDef),
        target = new Endpoint(tDoc.documentElement, this, "");

      plugin.onBundle({ profile });

      plugin.onTargetEndpoint(target, function (e, result) {
        assert.equal(e, undefined, e ? " error " : " no error");
        debug(`result: ${result}`);
        if (messages && messages.length) {
          debug(`messages: ${util.format(messages)}`);
          assert.equal(result, true);
          assert.equal(
            target.report.messages.length,
            messages.length,
            util.format(target.report.messages)
          );
          messages.forEach((msg, ix) => {
            debug(`check msg ${ix}: ${msg}`);
            assert.ok(
              target.report.messages.find((m) => m.message == msg),
              `index ${ix} ${util.format(target.report.messages)}`
            );
          });
        } else {
          assert.equal(result, false, util.format(target.report.messages));
          assert.equal(
            target.report.messages.length,
            0,
            util.format(target.report.messages)
          );
        }
      });
    });
  };

const test = function (caseNum, desc, targetDef, messages) {
  return testBase(caseNum, "apigee", desc, targetDef, messages);
};
const testApigeeX = function (caseNum, desc, targetDef, messages) {
  return testBase(caseNum, "apigeex", desc, targetDef, messages);
};

describe(`${testID} - ${plugin.plugin.name}`, function () {
  test(
    20,
    "empty SSLInfo with https url",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo/>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ["SSLInfo configuration does not use Enabled=true"]
  );

  test(
    30,
    "SSLInfo Enabled = false",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>false</Enabled>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ["SSLInfo configuration does not use Enabled=true"]
  );

  test(
    40,
    "SSLInfo Enabled = true, no truststore",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    []
  );

  test(
    41,
    "SSLInfo Enabled = true, with TrustStore",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <TrustStore>truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    null
  );

  testApigeeX(
    90,
    "SSLInfo with Enforce",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <Enforce>true</Enforce>
        <TrustStore>truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    null
  );

  testApigeeX(
    91,
    "SSLInfo with Enforce",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <TrustStore>truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ["SSLInfo configuration does not use Enforce=true"]
  );

  test(
    92,
    "SSLInfo with Enforce - not ApigeeX",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <Enforce>true</Enforce>
        <TrustStore>truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ["SSLInfo configuration must not use the Enforce element"]
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
