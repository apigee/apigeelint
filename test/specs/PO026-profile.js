/*
  Copyright 2019-2022 Google LLC

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

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

const propertySetRefTest = (profile) => () => {
        const configuration = {
                debug: true,
                source: {
                  type: "filesystem",
                  path: path.resolve(__dirname, '../fixtures/resources/PO026-apigeex-proxy/apiproxy'),
                  bundleType: "apiproxy"
                },
                excluded: {},
                setExitCode: false,
                output: () => {}, // suppress output
                profile
              };
        const expectedCount = (profile == 'apigee') ? 8 : 0;

        bl.lint(configuration, (bundle) => {
          const items = bundle.getReport();
          assert.ok(items);
          assert.ok(items.length);
          items.forEach( (item) => {
            if (item.filePath.endsWith("/apiproxy/policies/AM-config-properties.xml")) {
              assert.equal(item.errorCount, expectedCount);
            }
          });
        });
      };


describe(`PO026 - PropertySetRef with various profiles`, () => {
  it(`should NOT generate errors with profile 'apigeex'`, propertySetRefTest('apigeex'));
  it(`should generate errors with profile 'apigee'`, propertySetRefTest('apigee'));
});


const testID = "PO026",
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("@xmldom/xmldom").DOMParser,
      fs = require("fs"),
      plugin = require(bl.resolvePlugin(testID));

const resourceUrlTest =
  (suffix, profile, cb) => {
    const filename = `AM-AssignVariable-${suffix}.xml`;
    it(`should correctly process ${filename} for profile ${profile}`, () => {
     const fqfname = path.resolve(__dirname, '../fixtures/resources/PO026-assignVariable-resourceUrl', filename),
          policyXml = fs.readFileSync(fqfname, 'utf-8'),
          doc = new Dom().parseFromString(policyXml),
          p = new Policy(doc.documentElement, this);

      p.getElement = () => doc.documentElement;

      plugin.onBundle({profile});
      plugin.onPolicy(p, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        cb(p, foundIssues);
      });
    });
  };


describe(`PO026 - AssignVariable with ResourceURL`, () => {

  resourceUrlTest('1', 'apigeex', (p, foundIssues) => {
    assert.equal(foundIssues, false);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(p.getReport().messages.length, 0, JSON.stringify(p.getReport().messages));
  });

  resourceUrlTest('1', 'apigee', (p, foundIssues) => {
    assert.equal(foundIssues, true);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(p.getReport().messages.length, 2);
    assert.ok(p.getReport().messages[0].message.indexOf("stray element")>0);
    assert.ok(p.getReport().messages[1].message.indexOf("You should have at least one of")>=0);
  });

});
