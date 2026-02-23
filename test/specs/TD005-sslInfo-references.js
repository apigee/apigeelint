/*
  Copyright 2019-2022,2025 Google LLC

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

const assert = require("node:assert"),
  testID = "TD005",
  util = require("node:util"),
  debug = require("debug")("apigeelint:" + testID),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  Endpoint = require("../../lib/package/Endpoint.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Dom = require("@xmldom/xmldom").DOMParser,
  test = function (caseNum, desc, targetDef, messages) {
    it(`case ${caseNum} ${desc}`, function () {
      let tDoc = new Dom().parseFromString(targetDef),
        target = new Endpoint(tDoc.documentElement, this, "");

      plugin.onTargetEndpoint(target, function (e, result) {
        assert.equal(e, undefined, e ? " error " : " no error");
        debug(`result: ${result}`);
        if (messages && messages.length) {
          assert.equal(result, true);
          assert.equal(
            messages.length,
            target.report.messages.length,
            util.format(target.report.messages),
          );
          messages.forEach((msg, ix) => {
            debug(`check msg ${ix}: ${msg}`);
            assert.ok(
              target.report.messages.find((m) => m.message == msg),
              `index ${ix} ${util.format(target.report.messages)}`,
            );
          });
        } else {
          assert.equal(result, false);
          assert.equal(target.report.messages.length, 0);
        }
      });
    });
  };

describe(`${testID} - ${plugin.plugin.name}`, function () {
  test(
    10,
    "SSLInfo Truststore no ref",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <TrustStore>truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ["When using a TrustStore, use a reference"],
  );

  test(
    11,
    "SSLInfo TrustStore ref",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <TrustStore>ref://truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    null,
  );

  test(
    20,
    "SSLInfo KeyStore no ref",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <ClientAuthEnabled>true</ClientAuthEnabled>
        <TrustStore>ref://truststore1</TrustStore>
        <KeyStore>keystore1</KeyStore>
        <KeyAlias>key1</KeyAlias>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ["When using a KeyStore, use a reference"],
  );

  test(
    21,
    "SSLInfo KeyStore ref",
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <ClientAuthEnabled>true</ClientAuthEnabled>
        <TrustStore>ref://truststore1</TrustStore>
        <KeyAlias>key1</KeyAlias>
        <KeyStore>ref://keystore1</KeyStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    null,
  );
});

describe(`${testID} - Print plugin results`, function () {
  it("should create a report object with valid schema", function () {
    debug("test configuration: " + JSON.stringify(configuration));
    var bundle = new Bundle(configuration);
    bl.executePlugin(testID, bundle);
    let report = bundle.getReport();
    assert.ok(report);

    let formatter = bl.getFormatter("json.js");
    assert.ok(formatter);

    let schema = require("./../fixtures/reportSchema.js"),
      Validator = require("jsonschema").Validator,
      v = new Validator(),
      jsonReport = JSON.parse(formatter(report)),
      validationResult = v.validate(jsonReport, schema);
    assert.equal(validationResult.errors.length, 0, validationResult.errors);
  });
});
