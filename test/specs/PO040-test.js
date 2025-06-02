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

const testID = "PO040",
  assert = require("assert"),
  fs = require("fs"),
  util = require("util"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser,
  rootDir = path.resolve(__dirname, "../fixtures/resources/PO040"),
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

describe(`${testID} - ExtractVariables/JSONPath returns correct results for policies`, () => {
  const testOneForProfile = (profile) => {
    const expectedErrorMessages = require(
      path.join(rootDir, `${profile}-messages.js`),
    );

    return (shortFileName) => {
      const policy = loadPolicy(rootDir, shortFileName);
      const policyType = policy.getType();
      let expected = expectedErrorMessages[shortFileName];

      it(`should ${expected ? "flag" : "pass"} ${shortFileName} in profile ${profile}`, () => {
        assert.notEqual(
          policyType,
          undefined,
          `${policyType} should be defined`,
        );
        plugin.onBundle({ profile });
        plugin.onPolicy(policy, (e, foundIssues) => {
          assert.equal(undefined, e, "should be undefined");
          const messages = policy.getReport().messages;
          assert.ok(messages, "messages should exist");
          if (expected) {
            if (!Array.isArray(expected)) {
              expected = [expected];
            }
            assert.equal(true, foundIssues, "should be issues");
            assert.equal(
              expected.length,
              messages.length,
              "unexpected number of messages",
            );
            debug(`${shortFileName}: messages: ${JSON.stringify(messages)}`);
            expected.forEach((expectedMessageStart, ix) => {
              debug(`${shortFileName}: message[0]: ${messages[0].message}`);
              assert.ok(messages[ix].message, "did not find message member");
              assert.ok(
                messages.find((item) =>
                  item.message.startsWith(expectedMessageStart),
                ),
                `did not find expected message (${expectedMessageStart}...)`,
              );
            });
          } else {
            debug(`${shortFileName}: messages: ${JSON.stringify(messages)}`);
            assert.equal(false, foundIssues, "should be no issues");
            assert.equal(messages.length, 0, "unexpected number of messages");
          }
        });
      });
    };
  };

  const files = fs.readdirSync(rootDir);
  it(`should find tests`, () => {
    assert.ok(files.length, "tests not found");
  });

  ["apigee", "apigeex"].forEach((profile) => {
    const testOne = testOneForProfile(profile);
    files
      .filter((shortFileName) => shortFileName.endsWith(".xml"))
      .forEach(testOne);
  });
});
