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

const testID = "TD017",
  assert = require("node:assert"),
  fs = require("node:fs"),
  util = require("node:util"),
  path = require("node:path"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Endpoint = require("../../lib/package/Endpoint.js"),
  Dom = require("@xmldom/xmldom").DOMParser,
  rootDir = path.resolve(__dirname, "../fixtures/resources/TD017"),
  debug = require("debug")(`apigeelint:${testID}-test`);

const loadEndpoint = (sourceDir, shortFileName) => {
  const fqPath = path.join(sourceDir, shortFileName),
    xml = fs.readFileSync(fqPath).toString("utf-8"),
    doc = new Dom().parseFromString(xml),
    endpoint = new Endpoint(doc.documentElement, null, "");
  endpoint.getFileName = () => shortFileName;
  return endpoint;
};

describe(`${testID} - TargetEndpoint URL check`, function () {
  const emptyUrlFileName = "http-empty-URL.xml";
  it(`check ${emptyUrlFileName} generates warning`, () => {
    const endpoint = loadEndpoint(rootDir, emptyUrlFileName);
    plugin.onTargetEndpoint(endpoint, (e, foundIssues) => {
      assert.equal(e, undefined, "should be undefined");
      const messages = endpoint.getReport().messages;
      debug(util.format(messages));
      assert.equal(true, foundIssues, "should be issues");
      assert.ok(messages, "messages should exist");
      assert.equal(1, messages.length, "unexpected number of messages");
      assert.equal(
        "URL element is present but empty in HTTPTargetConnection",
        messages[0].message,
        "unexpected message",
      );
    });
  });

  const nonEmptyUrlFileName = "http-nonempty-URL.xml";
  it(`check ${nonEmptyUrlFileName} generates no warning`, () => {
    const endpoint = loadEndpoint(rootDir, nonEmptyUrlFileName);
    plugin.onTargetEndpoint(endpoint, (e, foundIssues) => {
      assert.equal(e, undefined, "should be undefined");
      const messages = endpoint.getReport().messages;
      debug(util.format(messages));
      assert.equal(foundIssues, false, "should be no issues");
      assert.ok(messages, "messages should exist");
      assert.equal(messages.length, 0, "unexpected number of messages");
    });
  });
});
