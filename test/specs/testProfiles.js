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

const testID = "PO028",
      assert = require("assert"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("xmldom").DOMParser;

let testCases = [
      {
        positive: ["apigee", "apigeex"],
        negative: [],
       config: `<HMAC name="HMAC-1">
    <Algorithm>SHA-256</Algorithm>
    <Message>{template_for_message}</Message>
    <SecretKey ref='private.context-variable'/>
    <Output encoding='base64'>output_value</Output>
</HMAC>`},

      {
        positive: ["apigeex"],
        negative: ["apigee"],
config: `<ExternalCallout name="EC-1">
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
  (testcase, profile, flavor, cb) => {
      let policyXml = testcase,
          doc = new Dom().parseFromString(policyXml),
          p = new Policy(doc.documentElement, this);
          p.getElement = () => doc.documentElement;
    let flag = flavor? '' : 'NOT ',
        policyType = p.getType();

    it(`check ${policyType} is ${flag}available in profile ${profile}`, () => {
      plugin.onBundle({profile});
      plugin.onPolicy(p, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        cb(p, foundIssues);
      });
    });
  };

describe(`${testID} - policy availability in profiles`, function() {

  testCases.forEach(tc => {

    tc.positive.forEach(profile => {
      testOne(tc.config, profile, true, (p, foundIssues) => {
        assert.equal(foundIssues, false);
        assert.ok(p.getReport().messages, "messages exist");
        assert.equal(p.getReport().messages.length, 0, "unexpected number of messages");
      });
    });

    tc.negative.forEach(profile => {
      testOne(tc.config, profile, false, (p, foundIssues) => {
        assert.equal(foundIssues, true);
        assert.ok(p.getReport().messages, "messages undefined");
        assert.equal(p.getReport().messages.length, 1, "unexpected number of messages");
        assert.ok(p.getReport().messages[0].message, 'did not find message member');
        assert.match(p.getReport().messages[0].message, new RegExp(`The policy type \\([^\\)]+\\) is not available in the profile ${profile}.`));
      });
    });

  });
});
