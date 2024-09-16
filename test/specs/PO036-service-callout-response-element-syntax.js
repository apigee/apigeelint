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

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const testID = "PO036",
  assert = require("assert"),
  fs = require("fs"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  debug = require("debug")("apigeelint:" + testID),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser;

const test = (suffix, cb) => {
  const filename = `SC-Response-element-${suffix}.xml`;
  it(`should correctly process ${filename}`, () => {
    const fqfname = path.resolve(
        __dirname,
        "../fixtures/resources/PO036",
        filename
      ),
      policyXml = fs.readFileSync(fqfname, "utf-8"),
      doc = new Dom().parseFromString(policyXml),
      p = new Policy(doc.documentElement, this);

    p.getElement = () => doc.documentElement;

    //plugin.onBundle({ profile: "apigee" });

    plugin.onPolicy(p, (e, foundIssues) => {
      assert.equal(e, undefined, "should be undefined");
      cb(p, foundIssues);
    });
  });
};

describe(`PO036 - ServiceCallout Response element`, () => {
  test("valid", (p, foundIssues) => {
    //assert.equal(foundIssues, false);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(foundIssues, false);
    //assert.equal(messages.length, 0, JSON.stringify(messages));
  });

  test("invalid1", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 2, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(
      messages[0].message,
      "The Response element, when present, should specify a non-empty TEXT value."
    );
    assert.ok(messages[1].message, "did not find message 1");
    assert.equal(
      messages[1].message,
      "The Response element, when present, should not specify any attributes."
    );
  });

  test("invalid2", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 1, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(
      messages[0].message,
      "The Response element, when present, should specify a non-empty TEXT value."
    );
  });

  test("invalid3", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 1, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(
      messages[0].message,
      "When the Response element is present, the TEXT value should have no spaces."
    );
  });

  test("invalid4", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 1, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(
      messages[0].message,
      "Policy has more than one Response element."
    );
  });

  test("invalid5", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 1, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(
      messages[0].message,
      "The Response element, when present, should specify a non-empty TEXT value."
    );
  });

  test("invalid6", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 1, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(
      messages[0].message,
      "The Response element, when present, should not specify any attributes."
    );
  });
});
