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

const testID = "PO039",
  assert = require("node:assert"),
  fs = require("node:fs"),
  path = require("node:path"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  debug = require("debug")("apigeelint:" + testID),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser,
  rootDir = path.resolve(__dirname, "../fixtures/resources/PO039");

const test = (suffix, cb) => {
  const filename = `ML-test-${suffix}.xml`;
  it(`should correctly process ${filename}`, () => {
    const fqfname = path.join(rootDir, filename),
      policyXml = fs.readFileSync(fqfname, "utf-8"),
      doc = new Dom().parseFromString(policyXml),
      p = new Policy(rootDir, filename, this, doc);

    p.getElement = () => doc.documentElement;

    //plugin.onBundle({ profile: "apigee" });

    plugin.onPolicy(p, (e, foundIssues) => {
      assert.equal(e, undefined, "should be undefined");
      cb(p, foundIssues);
    });
  });
};

describe(`${testID} - MessageLogging RessourceType element`, () => {
  // test all the valid cases
  fs.readdirSync(rootDir)
    .map((shortFileName) => {
      let m = shortFileName.match("^.+-(valid.+)\\.xml$");
      if (m) {
        return m[1];
      }
    })
    .filter((suffix) => suffix)
    .forEach((suffix) => {
      test(suffix, (p, foundIssues) => {
        const messages = p.getReport().messages;
        assert.ok(messages, "messages undefined");
        debug(messages);
        assert.equal(foundIssues, false);
      });
    });

  test("invalid1", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 1, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(
      messages[0].message,
      "The value 'gce_instance' should not be used here. ResourceType should be 'global'",
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
      "The value 'apigee.googleapis.com/Environment' should not be used here. ResourceType should be 'global'",
    );
  });

  test("invalid3", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    const messages = p.getReport().messages;
    assert.ok(messages, "messages undefined");
    debug(messages);
    assert.equal(messages.length, 2, "unexpected number of messages");
    assert.ok(messages[0].message, "did not find message 0");
    assert.equal(messages[0].message, "Unsupported element 'NotKey'");
    assert.equal(
      messages[1].message,
      "Label is missing a required Element: Key.",
    );
  });
});
