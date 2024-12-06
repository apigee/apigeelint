/*
  Copyright 2022-2024 Google LLC

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

const testID = "PO007",
  assert = require("assert"),
  fs = require("fs"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Policy = require("../../lib/package/Policy.js"),
  Dom = require("@xmldom/xmldom").DOMParser;

const test = (filename, cb) => {
  it(`should correctly process ${filename}`, () => {
    let baseDir = path.resolve(
        __dirname,
        "../fixtures/resources/PO007-cors-policy",
      ),
      fqfname = path.resolve(baseDir, filename),
      policyXml = fs.readFileSync(fqfname, "utf-8"),
      doc = new Dom().parseFromString(policyXml),
      p = new Policy(baseDir, fqfname, this, doc);

    p.getElement = () => doc.documentElement;

    plugin.onPolicy(p, (e, foundIssues) => {
      assert.equal(e, undefined, "should be undefined");
      cb(p, foundIssues);
    });
  });
};

describe(`PO007 - CORS policy name`, () => {
  test("CORS-1.xml", (p, foundIssues) => {
    assert.equal(foundIssues, false);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(
      p.getReport().messages.length,
      0,
      JSON.stringify(p.getReport().messages),
    );
  });

  test("AM-CORS-1.xml", (p, foundIssues) => {
    assert.equal(foundIssues, true);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(
      p.getReport().messages.length,
      1,
      "unexpected number of messages",
    );
    assert.ok(p.getReport().messages[0].message, "did not find message member");
    assert.equal(
      p.getReport().messages[0].message,
      'Non-standard name for policy (AM-CORS-1). Valid prefixes for the CORS policy: ["cors"]. Valid patterns: ["^cors$"].',
    );
  });

  test("CORS.xml", (p, foundIssues) => {
    assert.equal(foundIssues, false);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(
      p.getReport().messages.length,
      0,
      JSON.stringify(p.getReport().messages),
    );
  });
});
