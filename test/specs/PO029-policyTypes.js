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

const testID = "PO029",
      assert = require("assert"),
      fs = require("fs"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("@xmldom/xmldom").DOMParser,
      rootDir = path.resolve(__dirname, '../fixtures/resources/PO029-policyTypes');

const loadPolicy = (sourceDir, shortFileName) => {
    let fqPath = path.join(sourceDir, shortFileName),
        policyXml = fs.readFileSync(fqPath).toString('utf-8'),
        doc = new Dom().parseFromString(policyXml),
        p = new Policy(doc.documentElement, this);
        p.getElement = () => doc.documentElement;
        p.fileName = shortFileName;
        return p;
  };

describe(`${testID} - policy is of known type`, function() {
  let sourceDir = path.join(rootDir, 'positive');
  let testOne = (shortFileName) => {
        let policy = loadPolicy(sourceDir, shortFileName);
        let policyType = policy.getType();
        it(`check ${policyType} is known`, () => {
          assert.notEqual(policyType, undefined, `${policyType} should be defined`);
          plugin.onPolicy(policy, (e, foundIssues) => {
            assert.equal(e, undefined, "should be undefined");
            assert.equal(foundIssues, false, "should be no issues");
            let messages = policy.getReport().messages;
            assert.ok(messages, "messages should exist");
            assert.equal(messages.length, 0, "unexpected number of messages");
          });
        });
      };

  fs.readdirSync(sourceDir)
    .filter( shortFileName => shortFileName.endsWith(".xml"))
    .forEach( testOne );

});

describe(`${testID} - policy is of unknown type`, () => {
  let sourceDir = path.join(rootDir, 'negative');
  let testOne = (shortFileName) => {
        let policy = loadPolicy(sourceDir, shortFileName);
        let policyType = policy.getType();
        it(`check ${policyType} is unknown`, () => {
          assert.notEqual(policyType, undefined, `${policyType} should be defined`);
          plugin.onPolicy(policy, (e, foundIssues) => {
            assert.equal(e, undefined, "should be undefined");
            assert.equal(foundIssues, true, "should be issues");
            let messages = policy.getReport().messages;
            assert.ok(messages, "messages should exist");
            assert.equal(messages.length, 1, "unexpected number of messages");
            assert.ok(messages[0].message, 'did not find message member');
            assert.equal(messages[0].message, `The policy type (${policyType}) is not recognized`);
          });
        });
      };

  fs.readdirSync(sourceDir)
    .filter( shortFileName => shortFileName.endsWith(".xml"))
    .forEach( testOne );

});
