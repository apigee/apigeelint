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

/* global describe, it, __dirname */

const assert = require("assert"),
  path = require("path"),
  util = require("util"),
  ruleId = "PO037",
  debug = require("debug")("apigeelint:" + ruleId),
  bl = require("../../lib/package/bundleLinter.js");

const expectedErrors = {
  "DataCapture-URIPath-empty-Source-1.xml": [
    "The DataCapture policy is attached to a Request flow, uses URIPath, and this Capture uses an empty Source. Source should be absent, or a request message."
  ],

  "DataCapture-URIPath-empty-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture uses an empty Source. Source should be a request message."
  ],

  "DataCapture-URIPath-no-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture does not specify a Source. Source should be a request message."
  ],

  "DataCapture-URIPath-with-message-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture uses a response message as Source. Source should be a request message."
  ],

  "DataCapture-URIPath-with-response-Source-1.xml": [
    "The DataCapture policy is attached to a Request flow, and this Capture uses a response message as Source. The response is not yet available in the Request flow."
  ],

  "DataCapture-URIPath-with-response-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture uses a response message as Source. Source should be a request message."
  ]
};

describe(`PO037 - DataCapture Source usage`, () => {
  const configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: path.resolve(
        __dirname,
        "../fixtures/resources/PO037/datacapture1",
        "apiproxy"
      ),
      bundleType: "apiproxy",
      profile: "apigeex"
    },
    excluded: {},
    setExitCode: false,
    output: () => {} // suppress output
  };

  debug(`PO037 configuration: ${util.format(configuration)}`);
  bl.lint(configuration, (bundle) => {
    const items = bundle.getReport();
    assert.ok(items);
    assert.ok(items.length);
    const po037Items = items.filter((item) =>
      item.messages.some((m) => m.ruleId == "PO037")
    );
    debug(`po037Items: ${util.format(po037Items.map((i) => i.filePath))}`);

    assert.equal(po037Items.length, Object.keys(expectedErrors).length);

    Object.keys(expectedErrors).forEach((policyName, caseNum) => {
      it(`should generate the expected errors for ${policyName}`, () => {
        debug(`policyName: ${policyName}`);
        const expected = expectedErrors[policyName];
        const policyItems = po037Items.filter((item) =>
          item.filePath.endsWith(policyName)
        );
        debug(`policyItems: ${util.format(policyItems)}`);

        assert.equal(policyItems.length, 1);
        const po037Messages = policyItems[0].messages.filter(
          (m) => m.ruleId == "PO037"
        );
        debug(`po035Messages: ${util.format(po037Messages)}`);
        assert.equal(po037Messages.length, expected.length);
        assert.equal(po037Messages.length, 1);

        assert.equal(
          po037Messages[0].message,
          expected[0],
          `${policyName} case(${caseNum})`
        );
      });
    });
  });
});
