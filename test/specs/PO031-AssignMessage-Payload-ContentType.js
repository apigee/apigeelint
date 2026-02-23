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

const testID = "PO031",
  assert = require("node:assert"),
  fs = require("node:fs"),
  path = require("node:path"),
  //util = require('util'),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser,
  rootDir = path.resolve(
    __dirname,
    "../fixtures/resources/PO031-AssignMessage-Payload-ContentType",
  ),
  debug = require("debug")("apigeelint:" + testID);

const loadPolicy = function (sourceDir, shortFileName) {
  let fqPath = path.join(sourceDir, shortFileName),
    policyXml = fs.readFileSync(fqPath).toString("utf-8"),
    doc = new Dom().parseFromString(policyXml),
    p = new Policy(rootDir, shortFileName, this, doc);

  p.fileName = shortFileName;
  p.getElement = () => doc.documentElement;
  return p;
};

describe(`${testID} - Payload Content-Type looks good`, function () {
  let sourceDir = path.join(rootDir, "pass");
  let testOne = (shortFileName) => {
    it(`checks no error (${shortFileName})`, () => {
      let policy = loadPolicy(sourceDir, shortFileName);
      // I don't know why this it function must return a Promise, in order
      // for the assertions to actually work.  It seems the similar tests
      // for PO029 do not require this. Not clear why. But in any case, do
      // not change this unless you're sure.
      return new Promise(function (resolve, reject) {
        plugin.onPolicy(policy, (e, foundIssues) => {
          try {
            assert.equal(e, undefined, "should be undefined");
            assert.equal(foundIssues, false, "should be no issues");
            let messages = policy.getReport().messages;
            assert.ok(messages, "messages should exist");
            assert.equal(messages.length, 0, "unexpected number of messages");
          } catch (ex) {
            return reject(ex);
          }
          return resolve();
        });
      });
    });
  };

  fs.readdirSync(sourceDir)
    .filter((shortFileName) => shortFileName.endsWith(".xml"))
    .forEach(testOne);
});

describe(`${testID} - Payload content-type looks wrong`, () => {
  let sourceDir = path.join(rootDir, "fail");
  const expectedErrorMessages = require(path.join(sourceDir, "messages.js"));

  let testOne = (shortFileName) => {
    let policy = loadPolicy(sourceDir, shortFileName);
    it(`checks expected error (${shortFileName})`, () => {
      assert.ok(policy, "policy should exist");
      // I don't know why this it function must return a Promise, in order
      // for the assertions to actually work.  It seems the similar tests
      // for PO029 do not require this. Not clear why. But in any case, do
      // not change this unless you're sure.
      return new Promise(function (resolve, reject) {
        plugin.onPolicy(policy, (e, foundIssues) => {
          try {
            assert.equal(e, undefined, "should be undefined");
            assert.equal(foundIssues, true, "should be issues");
            let messages = policy.getReport().messages;
            assert.ok(messages, "messages should exist");
            assert.equal(messages.length, 1, "unexpected number of messages");
            assert.ok(messages[0].message, "did not find message member");
            let expected = expectedErrorMessages[policy.fileName];
            assert.ok(
              expected,
              "test configuration failure: did not find an expected message",
            );
            assert.equal(
              messages[0].message,
              expected,
              "did not find expected message",
            );
            debug(`message[0]: ${messages[0].message}`);
          } catch (ex) {
            return reject(ex);
          }
          return resolve();
        });
      });
    });
  };

  fs.readdirSync(sourceDir)
    .filter((shortFileName) => shortFileName.endsWith(".xml"))
    .forEach(testOne);
});
