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

const testID = "PO028",
  assert = require("node:assert"),
  fs = require("node:fs"),
  path = require("node:path"),
  util = require("node:util"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser,
  rootDir = path.resolve(__dirname, "../fixtures/resources/PO028"),
  debug = require("debug")("apigeelint:" + testID);

const loadPolicy = (sourceDir, shortFileName) => {
  let fqPath = path.join(sourceDir, shortFileName),
    policyXml = fs.readFileSync(fqPath).toString("utf-8"),
    doc = new Dom().parseFromString(policyXml),
    p = new Policy(rootDir, shortFileName, this, doc);
  p.getElement = () => doc.documentElement;
  p.fileName = shortFileName;
  return p;
};

const messageRe = new RegExp(
  "^The policy type \\(([A-Za-z]+)\\) is not available in the profile apigeex?.$",
);

const testOneProfile = function (okExpected, profile) {
  let testOne = (testCasesDir) => (shortFileName) => {
    let policy = loadPolicy(testCasesDir, shortFileName);
    let policyType = policy.getType();
    let expectedResult = okExpected ? "succeeds" : "throws error";
    it(`check ${policyType} ${expectedResult}`, () => {
      assert.notEqual(policyType, undefined, `${policyType} should be defined`);
      plugin.onBundle({ profile });
      plugin.onPolicy(policy, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        if (okExpected) {
          debug(`foundIssues: ${foundIssues}`);
          assert.equal(foundIssues, false, "should be issues");
          let messages = policy.getReport().messages;
          debug(`messages:` + util.format(messages));
          assert.ok(messages, "messages should exist");
          assert.equal(messages.length, 0, "unexpected number of messages");
        } else {
          assert.equal(foundIssues, true, "should be issues");
          let messages = policy.getReport().messages;
          assert.ok(messages, "messages should exist");
          assert.equal(messages.length, 1, "unexpected number of messages");
          debug(`message[0]: ${messages[0].message}`);
          assert.ok(messages[0].message, "did not find message member");
          assert.ok(
            messages[0].message.match(messageRe),
            "did not find expected message",
          );
          assert.equal(messages[0].severity, 2, "severity should be error");
        }
      });
    });
  };

  let profileDir = path.join(rootDir, profile);
  let subdir = okExpected ? "positive" : "negative";
  let testCasesDir = path.join(profileDir, subdir);

  let testCases = fs
    .readdirSync(testCasesDir)
    .filter((n) => n.endsWith(".xml"));
  assert.ok(testCases.length, "test cases do not exist");
  testCases.forEach(testOne(testCasesDir));

  // let negativeDir = path.join(profileDir, 'negative');
  // let negativeTestCases = fs.readdirSync(negativeDir).filter( n => n.endsWith(".xml"));
  // assert.ok(negativeTestCases.length, "test cases do not exist");
  // negativeTestCases.forEach( testOne(false) );
};

describe(`${testID} - valid policies in --profile 'apigeex'`, () => {
  testOneProfile(true, "apigeex");
});

describe(`${testID} - invalid policies in --profile 'apigeex'`, () => {
  testOneProfile(false, "apigeex");
});

describe(`${testID} - valid policies in --profile 'apigee'`, () => {
  testOneProfile(true, "apigee");
});
describe(`${testID} - invalid policies in --profile 'apigee'`, () => {
  testOneProfile(false, "apigee");
});
