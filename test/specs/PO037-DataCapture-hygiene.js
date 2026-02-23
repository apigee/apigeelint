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

/* global describe, it, __dirname */

const assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  ruleId = "PO037",
  debug = require("debug")("apigeelint:" + ruleId),
  bl = require("../../lib/package/bundleLinter.js");

const expectedErrors = {
  "DC-Collect-multiple-Source.xml": [
    "There should be at most one Source element in each Capture in the DataCapture policy.",
  ],
  "DC-Capture-multiple-Collect.xml": [
    "The DataCapture policy has a Capture with more than one Collect element.",
  ],
  "DC-DataCollector-empty.xml": [
    "The DataCollector element should specify a non-empty TEXT value.",
  ],
  "DC-multiple-DataCollector.xml": [
    "The DataCapture policy has a Capture with more than one DataCollector element.",
  ],
  "DC-Collect-Source-with-attrs.xml": [
    "The Source element, when present, should not specify any attributes.",
  ],
  "DC-Collect-missing.xml": [
    "The DataCapture policy has a Capture with no Collect element.",
  ],
  "DC-Collect-Source-with-child-elements.xml": [
    "The Source element should be a simple TEXT node. No other child nodes.",
  ],
  "DC-Collect-ref-extra-attribute.xml": [
    "The Collect element should not specify the extra-attr attribute.",
  ],
  "DC-Collect-ref-no-default.xml": [
    "The Collect element is missing the required default attribute.",
  ],

  "DC-DataCollector-missing.xml": [
    "The DataCapture policy has a Capture with no DataCollector element.",
  ],

  "DC-DataCollector-with-child-elements.xml": [
    "The DataCollector element should be a simple TEXT node. No other child nodes.",
  ],

  "DC-DataCollector-with-unsupported-attr.xml": [
    "The DataCollector element should not specify the other-attr attribute.",
  ],

  "DataCapture-URIPath-empty-Source-1.xml": [
    "The Source element, when present, should specify a non-empty TEXT value.",
  ],

  "DataCapture-URIPath-empty-Source-2.xml": [
    "The Source element, when present, should specify a non-empty TEXT value.",
  ],

  "DataCapture-QueryParam-empty-Source-1.xml": [
    "The Source element, when present, should specify a non-empty TEXT value.",
  ],

  "DataCapture-QueryParam-empty-Source-2.xml": [
    "The Source element, when present, should specify a non-empty TEXT value.",
  ],

  "DataCapture-URIPath-no-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture does not specify a Source. The Source will be the response message, and this will never match.",
  ],

  "DataCapture-URIPath-with-message-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture uses a response message as Source. Source should be a request message.",
  ],

  "DataCapture-URIPath-with-response-Source-1.xml": [
    "The DataCapture policy is attached to a Request flow, and this Capture uses a response message as Source. The response is not yet available in the Request flow.",
  ],

  "DataCapture-URIPath-with-response-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture uses a response message as Source. Source should be a request message.",
  ],
  "DataCapture-QueryParam-no-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses QueryParam, and this Capture does not specify a Source. The Source will be the response message, and this will never match.",
  ],

  "DataCapture-QueryParam-with-message-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses QueryParam, and this Capture uses a response message as Source. Source should be a request message.",
  ],

  "DataCapture-QueryParam-with-response-Source-1.xml": [
    "The DataCapture policy is attached to a Request flow, and this Capture uses a response message as Source. The response is not yet available in the Request flow.",
  ],

  "DataCapture-QueryParam-with-response-Source-2.xml": [
    "The DataCapture policy is attached to a Response flow, uses QueryParam, and this Capture uses a response message as Source. Source should be a request message.",
  ],
};

describe(`PO037 - DataCapture Source usage`, () => {
  const configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: path.resolve(
        __dirname,
        "../fixtures/resources/PO037/datacapture1",
        "apiproxy",
      ),
      bundleType: "apiproxy",
    },
    profile: "apigeex",
    excluded: {},
    setExitCode: false,
    output: () => {}, // suppress output
  };

  let items = null,
    po037Items = null;

  /*
   * Tests must not run the linter outside of the scope of an it() ,
   * because then the mocha --grep does not do what you want.
   * This method insures we run the lint once, but only within
   * the scope of it().
   **/
  const insure = (cb) => {
    if (items == null) {
      debug(`PO037 configuration: ${util.format(configuration)}`);
      bl.lint(configuration, (bundle) => {
        items = bundle.getReport();
        assert.ok(items);
        assert.ok(items.length);
        po037Items = items.filter((item) =>
          item.messages.some((m) => m.ruleId == "PO037"),
        );
        cb();
      });
    } else {
      cb();
    }
  };

  it(`should generate the expected number of PO037 errors`, () => {
    insure(() => {
      debug(`po037Items: ${util.format(po037Items.map((i) => i.filePath))}`);
      assert.equal(po037Items.length, Object.keys(expectedErrors).length);
    });
  });

  it(`should generate no errors other than PO037`, () => {
    insure(() => {
      const nonPO37Items = items.filter((item) =>
        item.messages.some((m) => m.ruleId != "PO037" && m.ruleId != "BN014"),
      );
      debug(
        `nonPO37Items: ${util.format(nonPO37Items.map((i) => i.filePath))}`,
      );
      assert.equal(nonPO37Items.length, 0);
    });
  });

  Object.keys(expectedErrors).forEach((policyName, caseNum) => {
    it(`should generate the expected errors for ${policyName}`, () => {
      insure(() => {
        debug(`policyName: ${policyName}`);
        const expected = expectedErrors[policyName];
        const policyItems = po037Items.filter((item) =>
          item.filePath.endsWith(policyName),
        );
        debug(`policyItems: ${util.format(policyItems)}`);

        assert.equal(policyItems.length, 1);
        const po037Messages = policyItems[0].messages.filter(
          (m) => m.ruleId == "PO037",
        );
        debug(`po037Messages: ${util.format(po037Messages)}`);
        assert.equal(po037Messages.length, expected.length);
        assert.equal(po037Messages.length, 1);

        assert.equal(
          po037Messages[0].message,
          expected[0],
          `${policyName} case(${caseNum})`,
        );
      });
    });
  });
});
