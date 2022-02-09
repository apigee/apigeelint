/*
  Copyright 2019-2022 Google LLC

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
      test = function(caseNum, desc, targetDef, messages) {
        it(`case ${caseNum} ${desc}`,
           function() {
             let tDoc = new Dom().parseFromString(targetDef),
                 target = new Endpoint(tDoc.documentElement, this, "");

             plugin.onTargetEndpoint(target, function(e, result) {
               assert.equal(e, undefined, e ? " error " : " no error");
               debug(`result: ${result}`);
               if (messages && messages.length) {
                 assert.equal(result, true);
                 assert.equal(messages.length,target.report.messages.length, util.format(target.report.messages));
                 messages.forEach( (msg, ix) => {
                   debug(`check msg ${ix}: ${msg}`);
                   assert.ok(
                     target.report.messages.find(m => m.message == msg),
                     `index ${ix} ${util.format(target.report.messages)}`);
                 });
               }
               else {
                 assert.equal(result, false);
                 assert.equal(target.report.messages.length, 0);
               }
             });
           } );
      };

describe(`${testID} - ${plugin.plugin.name}`, function() {

  test(
    10,
    'missing SSLInfo',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['Missing SSLInfo configuration']
  );

  test(
    20,
    'empty SSLInfo',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo/>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['SSLInfo configuration is not Enabled', 'Missing TrustStore in SSLInfo']
  );

  test(
    30,
    'SSLInfo Enabled = false',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>false</Enabled>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['SSLInfo configuration is not Enabled', 'Missing TrustStore in SSLInfo']
  );


  test(
    40,
    'SSLInfo Enabled = true, no truststore',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['Missing TrustStore in SSLInfo']
  );

  test(
    41,
    'SSLInfo Enabled = true, with TrustStore',
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
    null
  );

  test(
    42,
    'SSLInfo Enabled = true, ignoreerrors = false',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <IgnoreValidationErrors>false</IgnoreValidationErrors>
        <TrustStore>truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    null
  );

  test(
    50,
    'SSLInfo IgnoreValidationErrors = true',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <IgnoreValidationErrors>true</IgnoreValidationErrors>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['SSLInfo configuration includes IgnoreValidationErrors = true', 'Missing TrustStore in SSLInfo']
  );

  test(
    60,
    'SSLInfo IgnoreValidationErrors = true and Enabled = false',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>false</Enabled>
        <IgnoreValidationErrors>true</IgnoreValidationErrors>
        <TrustStore>truststore1</TrustStore>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['SSLInfo configuration includes IgnoreValidationErrors = true', 'SSLInfo configuration is not Enabled']
  );

  test(
    70,
    'SSLInfo ClientAuthEnabled all good',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <ClientAuthEnabled>true</ClientAuthEnabled>
        <TrustStore>truststore1</TrustStore>
        <KeyStore>keystore1</KeyStore>
        <KeyAlias>key1</KeyAlias>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    null
  );

  test(
    71,
    'SSLInfo ClientAuthEnabled missing KeyStore',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <ClientAuthEnabled>true</ClientAuthEnabled>
        <TrustStore>truststore1</TrustStore>
        <!--
          <KeyStore>keystore1</KeyStore>
          <KeyAlias>key1</KeyAlias>
        -->
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['When ClientAuthEnabled = true, use a KeyStore and KeyAlias']
  );

  test(
    72,
    'SSLInfo ClientAuthEnabled missing KeyStore',
    `<TargetEndpoint name="default">
    <HTTPTargetConnection>
      <SSLInfo>
        <Enabled>true</Enabled>
        <ClientAuthEnabled>false</ClientAuthEnabled>
        <TrustStore>truststore1</TrustStore>
          <KeyStore>keystore1</KeyStore>
          <KeyAlias>key1</KeyAlias>
      </SSLInfo>
      <URL>https://foo.com/apis/{api_name}/maskconfigs</URL>
      <Properties/>
    </HTTPTargetConnection>
  </TargetEndpoint>`,
    ['When ClientAuthEnabled = false, do not use a KeyStore and KeyAlias']
  );

  });

describe(`${testID} - Print plugin results`, function() {
  debug("test configuration: " + JSON.stringify(configuration));
  var bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);
  let report = bundle.getReport();

  it("should create a report object with valid schema", function() {

    let formatter = bl.getFormatter("json.js");
    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }
    let schema = require("./../fixtures/reportSchema.js"),
        Validator = require("jsonschema").Validator,
        v = new Validator(),
        jsonReport = JSON.parse(formatter(report)),
        validationResult = v.validate(jsonReport, schema);
    assert.equal(
      validationResult.errors.length,
      0,
      validationResult.errors
    );
  });

});
