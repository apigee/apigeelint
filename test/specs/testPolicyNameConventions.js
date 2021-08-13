/*
  Copyright 2019-2021 Google LLC

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

const testID = "PO007",
      assert = require("assert"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("xmldom").DOMParser;

let testCases = [
      {
        positive: ["HMAC-1", "HMAC-Get-Value"],
        negative: ["Foobar-1"],
       config: `<HMAC name="@@NAME@@">
    <Algorithm>SHA-256</Algorithm>
    <Message>{template_for_message}</Message>
    <SecretKey ref='private.context-variable'/>
    <Output encoding='base64'>output_value</Output>
</HMAC>`},

      {
        positive: ["SC-1", "Callout-Get-Value"],
        negative: ["Call-1", "Foo-1"],
config: `<ServiceCallout name='@@NAME@@'>
  <Request variable='simpleGetRequest'>
    <Set>
      <Verb>GET</Verb>
      <Path>/status</Path>
    </Set>
  </Request>
  <HTTPTargetConnection>
    <SSLInfo>
      <Enabled>true</Enabled>
      <IgnoreValidationErrors>false</IgnoreValidationErrors>
    </SSLInfo>
    <Properties/>
    <URL>https://dchiesa-first-project.appspot.com</URL>
  </HTTPTargetConnection>
</ServiceCallout>`},

      {
        positive: ["EC-1", "External-1"],
        negative: ["ExternalC-Hello", "Foo-1"],
config: `<ExternalCallout name="@@NAME@@">
  <GrpcConnection>
    <Server name="grpcserver"/>

  </GrpcConnection>

  <TimeoutMs>5000</TimeoutMs>
  <Configurations>
    <Property name="with.request.content">true</Property>
    <Property name="with.request.headers">true</Property>
    <Property name="with.response.content">true</Property>
    <Property name="with.response.headers">true</Property>
  </Configurations>
</ExternalCallout>
`
      }
      // add other policy types here as desired
      ];

const testOne =
  (testcase, ix, cb) => {
      let policyXml = testcase,
          doc = new Dom().parseFromString(policyXml),
          p = new Policy(doc.documentElement, this);
          p.getElement = () => doc.documentElement;

    let policyName = p.getName(),
          policyType = p.getType();

    it(`check name of ${policyType} policy named ${policyName}`, () => {
      plugin.onPolicy(p, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        cb(p, foundIssues);
      });
    });
  };

describe("PO007 - policy name conventions", function() {

  testCases.forEach((tc, ix0) => {

    tc.positive.forEach((name, ix1) => {
      let configXml = tc.config.replace('@@NAME@@', name);
      testOne(configXml, `${ix0} positive.${ix1}`, (p, foundIssues) => {
        assert.equal(foundIssues, false);
        assert.ok(p.getReport().messages, "messages exist");
        assert.equal(p.getReport().messages.length, 0, "unexpected number of messages");
      });
    });

    tc.negative.forEach((name, ix1) => {
      let configXml = tc.config.replace('@@NAME@@', name);
      testOne(configXml, `${ix0} negative.${ix1}`, (p, foundIssues) => {
        assert.equal(foundIssues, true);
        assert.ok(p.getReport().messages, "messages undefined");
        assert.equal(p.getReport().messages.length, 1, "unexpected number of messages");
        assert.ok(p.getReport().messages[0].message, 'did not find message member');
        assert.ok(p.getReport().messages[0].message.startsWith('Non-standard prefix '));
      });
    });

  });
});
