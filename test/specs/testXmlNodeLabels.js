/*
  Copyright © 2024-2026 Google LLC

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

/* global require, describe, before, it, __dirname */

const assert = require("node:assert"),
  Dom = require("@xmldom/xmldom").DOMParser,
  lintUtil = require("../../lib/package/lintUtil.js"),
  util = require("node:util"),
  path = require("node:path"),
  debug = require("debug")("apigeelint:xmldom-test"),
  { runCliIntegrationTest } = require("../fixtures/cli-test-helper.js");

describe("xmldom path resolution verification", function () {
  this.slow(18000);
  const proxyDir = path.resolve(__dirname, "../fixtures/resources/issue481");

  it("should resolve to a path", function (done) {
    try {
      const p = lintUtil.getNodeModulesPathFor("@xmldom/xmldom");
      assert.ok(p);
    } catch (e) {
      assert.fail();
    }
    done();
  });

  it("should find xmldom", function (done) {
    this.timeout(58000);
    const options = {
      testDir: proxyDir,
      cliArgs: ["-s", path.join(proxyDir, "sample/apiproxy")]
    };

    runCliIntegrationTest(options, (code, items, stderr) => {
      if (code != 0) {
        debug(`stderr: ${stderr}`);
      }
      assert.equal(code, 0, "return status code");
      done();
    });
  });
});

describe("xmldom element name tests", function () {
  let xml;
  const exampleXml = `<root attr1="hello"><!-- comment --><A><B/></A></root>`;
  before(function () {
    xml = new Dom().parseFromString(exampleXml);
  });

  it("should properly name the document node", function (done) {
    assert.ok(xml);
    const nodeTypeString = lintUtil.xmlNodeTypeAsString(xml.nodeType);
    assert.ok(nodeTypeString);
    assert.equal(nodeTypeString, "DOCUMENT_NODE");
    done();
  });

  it("should properly name the root element node", function (done) {
    assert.ok(xml.documentElement.nodeType);
    const nodeTypeString = lintUtil.xmlNodeTypeAsString(
      xml.documentElement.nodeType,
    );
    assert.ok(nodeTypeString);
    assert.equal(nodeTypeString, "ELEMENT_NODE");
    done();
  });

  it("should properly name the comment node", function (done) {
    const fc = xml.documentElement.firstChild;
    assert.ok(fc);
    const nodeTypeString = lintUtil.xmlNodeTypeAsString(fc.nodeType);
    assert.ok(nodeTypeString);
    assert.equal(nodeTypeString, "COMMENT_NODE");
    done();
  });

  it("should properly name the attribute node", function (done) {
    const attr = xml.documentElement.getAttributeNode("attr1");
    debug(`attrs(${attr})`);
    debug(`attrs(${util.format(attr)})`);
    assert.ok(attr);
    let nodeTypeString = lintUtil.xmlNodeTypeAsString(attr.nodeType);
    debug(`nodeTypeString(${nodeTypeString})`);
    assert.ok(nodeTypeString);
    assert.equal(nodeTypeString, "ATTRIBUTE_NODE");
    done();
  });
});
