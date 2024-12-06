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

/* global describe, it */

const testID = "PO038",
  assert = require("assert"),
  fs = require("fs"),
  util = require("util"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser,
  rootDir = path.resolve(__dirname, "../fixtures/resources/PO038"),
  debug = require("debug")(`apigeelint:${testID}-test`);

const loadPolicy = (sourceDir, shortFileName) => {
  const fqPath = path.join(sourceDir, shortFileName),
    policyXml = fs.readFileSync(fqPath).toString("utf-8"),
    doc = new Dom().parseFromString(policyXml),
    p = new Policy(rootDir, shortFileName, this, doc);
  p.getElement = () => doc.documentElement;
  p.fileName = shortFileName;
  return p;
};

describe(`${testID} - policy passes KVM hygiene check`, function () {
  const sourceDir = path.join(rootDir, "pass");
  const testOne = (shortFileName) => {
    const policy = loadPolicy(sourceDir, shortFileName);
    const profile = shortFileName.split(".")[0].split("-").slice(-1)[0];
    const policyType = policy.getType();
    it(`check ${shortFileName} passes`, () => {
      assert.notEqual(policyType, undefined, `${policyType} should be defined`);
      plugin.onBundle({ profile });
      plugin.onPolicy(policy);
      const report = policy.getReport();
      const foundIssues = report.errorCount != 0 || report.warningCount != 0;
      const messages = report.messages;
      debug(`pass ${shortFileName} issues: ${foundIssues}`);
      debug(`pass ${shortFileName} messages: ${util.format(messages)}`);
      assert.equal(foundIssues, false, "should be no issues");
      assert.ok(messages, "messages should exist");
      assert.equal(messages.length, 0, "unexpected number of messages");
    });
  };

  fs.readdirSync(sourceDir)
    .filter((shortFileName) => shortFileName.endsWith(".xml"))
    .forEach(testOne);
});

describe(`${testID} - policy does not pass KVM hygiene check`, () => {
  const sourceDir = path.join(rootDir, "fail");
  const expectedErrorMessages = require(path.join(sourceDir, "messages.js"));
  const testOne = (shortFileName) => {
    const policy = loadPolicy(sourceDir, shortFileName);
    const profile = shortFileName.split(".")[0].split("-").slice(-1)[0];
    const policyType = policy.getType();
    it(`check ${shortFileName} throws error`, () => {
      assert.notEqual(policyType, undefined, `${policyType} should be defined`);
      plugin.onBundle({ profile });
      plugin.onPolicy(policy);
      const report = policy.getReport();
      const foundIssues = report.errorCount != 0 || report.warningCount != 0;
      debug(`onPolicy: ${policy.getName()}`);
      assert.equal(true, foundIssues, "should be issues");
      const messages = report.messages;
      assert.ok(messages, "messages should exist");
      debug(util.format(messages));
      let expectedList = expectedErrorMessages[policy.fileName];
      assert.ok(
        expectedList,
        "test configuration failure: did not find an expected message",
      );
      if (typeof expectedList == "string") {
        expectedList = [expectedList];
      }
      assert.equal(
        expectedList.length,
        messages.length,
        "unexpected number of messages",
      );

      expectedList.forEach((expected, ix) => {
        debug(`expected: ${expected}`);
        debug(`actual: ${messages[ix].message}`);
        assert.ok(messages[ix]);
        assert.ok(messages[ix].message);
        assert.equal(typeof messages[ix].message, "string");
        assert.equal(typeof expected, "string");
        assert.equal(
          expected,
          messages[ix].message,
          "did not find expected message",
        );
      });
    });
  };

  fs.readdirSync(sourceDir)
    .filter((shortFileName) => shortFileName.endsWith(".xml"))
    .forEach(testOne);
});
