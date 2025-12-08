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

/* global describe, it */

const testID = "PO042",
  assert = require("assert"),
  fs = require("fs"),
  util = require("util"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser,
  rootDir = path.resolve(__dirname, "../fixtures/resources/PO042/policies"),
  debug = require("debug")(`apigeelint:${testID}-test`);

const loadPolicy = (sourceDir, shortFileName) => {
  const fqPath = path.join(sourceDir, shortFileName),
    policyXml = fs.readFileSync(fqPath).toString("utf-8"),
    doc = new Dom().parseFromString(policyXml),
    p = new Policy(sourceDir, shortFileName, { bundletype: "apiproxy" }, doc);
  p.getElement = () => doc.documentElement;
  return p;
};

const profileSpecRe = new RegExp("(apigee|apigeex)-profile");

describe(`${testID} - policy passes hygiene evaluation`, function () {
  const sourceDir = path.join(rootDir, "pass");
  const testOne = (shortFileName) => {
    const policy = loadPolicy(sourceDir, shortFileName),
      policyType = policy.getType();
    it(`check ${shortFileName} passes`, () => {
      assert.notEqual(policyType, undefined, `${policyType} should be defined`);
      const profileSpec = profileSpecRe.exec(shortFileName);
      plugin.onBundle({ profile: profileSpec ? profileSpec[1] : "apigee" });

      plugin.onPolicy(policy, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        const messages = policy.getReport().messages;
        debug(util.format(messages));
        assert.equal(
          foundIssues,
          false,
          `should be no issues, found ${util.format(messages)}`,
        );
        assert.ok(messages, "messages should exist");
        assert.equal(messages.length, 0, "unexpected number of messages");
      });
    });
  };

  const candidates = fs
    .readdirSync(sourceDir)
    .filter((shortFileName) => shortFileName.endsWith(".xml"));

  it(`checks that there are tests`, () => {
    assert.ok(candidates.length > 0, "tests should exist");
  });

  candidates.forEach(testOne);
});

describe(`${testID} - policy does not pass hygiene evaluation`, () => {
  const sourceDir = path.join(rootDir, "fail"),
    expectedErrorMessages = require(path.join(sourceDir, "messages.js")),
    testOne = (shortFileName) => {
      const policy = loadPolicy(sourceDir, shortFileName),
        policyType = policy.getType();
      it(`check ${shortFileName} throws error`, () => {
        assert.notEqual(
          policyType,
          undefined,
          `${policyType} should be defined`,
        );

        const moreBundleProps = {
          getPolicies: () => [policy],
          profile: "apigee",
        };
        policy.parent = { ...policy.parent, ...moreBundleProps };
        plugin.onBundle(policy.parent);
        plugin.onPolicy(policy, (e, foundIssues) => {
          assert.equal(undefined, e, "should be undefined");
          assert.equal(true, foundIssues, "should be issues");
          const messages = policy.getReport().messages;
          assert.ok(messages, "messages for issues should exist");
          let expected = expectedErrorMessages[policy.fileName];
          assert.ok(
            expected,
            "test configuration failure: did not find an expected message",
          );
          if (!Array.isArray(expected)) {
            expected = [expected];
          }
          debug(`actual messages: ${util.format(messages)}`);
          assert.equal(
            expected.length,
            messages.length,
            "unexpected number of messages",
          );
          expected.forEach((msg) =>
            assert.ok(
              messages.find((m) => m.message == msg),
              `did not find expected(${msg}) in actual(${messages.map((m) => m.message).toString()})`,
            ),
          );
        });
      });
    };

  const candidates = fs
    .readdirSync(sourceDir)
    .filter((shortFileName) => shortFileName.endsWith(".xml"));

  it(`checks that there are tests`, () => {
    assert.ok(candidates.length > 0, "tests should exist");
  });

  candidates.forEach(testOne);
});
