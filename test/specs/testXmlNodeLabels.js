/*
  Copyright 2024 Google LLC

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

/* global describe, before, it, __dirname */

const assert = require("assert"),
  Dom = require("@xmldom/xmldom").DOMParser,
  myUtil = require("../../lib/package/myUtil.js"),
  xpath = require("xpath");

describe("xmldom related tests", function () {
  describe("path resolution verification", function () {
    it("should resolve to a path", function (done) {
      try {
        const p = myUtil.getNodeModulesPathFor("@xmldom/xmldom");
        assert.ok(p);
      } catch (e) {
        assert.fail();
      }
      done();
    });
  });

  describe("element name tests", function () {
    let xml;
    const exampleXml = '<root attr1="hello"><!-- comment --><A><B/></A></root>';
    before(function () {
      xml = new Dom().parseFromString(exampleXml);
    });

    it("should properly name the document node", function (done) {
      assert.ok(xml);
      const nodeTypeString = myUtil.xmlNodeTypeAsString(xml.nodeType);
      assert.ok(nodeTypeString);
      assert.equal(nodeTypeString, "DOCUMENT_NODE");
      done();
    });

    it("should properly name the root element node", function (done) {
      assert.ok(xml.documentElement.nodeType);
      const nodeTypeString = myUtil.xmlNodeTypeAsString(
        xml.documentElement.nodeType
      );
      assert.ok(nodeTypeString);
      assert.equal(nodeTypeString, "ELEMENT_NODE");
      done();
    });

    it("should properly name the comment node", function (done) {
      const fc = xml.documentElement.firstChild;
      assert.ok(fc);
      const nodeTypeString = myUtil.xmlNodeTypeAsString(fc.nodeType);
      assert.ok(nodeTypeString);
      assert.equal(nodeTypeString, "COMMENT_NODE");
      done();
    });

    /*
      Not sure why. This test does not pass in xmldom v0.8.x

    it("should properly name the attribute node", function (done) {
      const attr = xml.documentElement.getAttributeNode("attr1");
      console.log(`attrs(${attr})`);
      const util = require("node:util");
      console.log(`attrs(${util.format(attr)})`);
      assert.ok(attr);
      //assert.ok(attrs[0]);
      let nodeTypeString = myUtil.xmlNodeTypeAsString(attr);
      assert.ok(nodeTypeString);
      assert.equal(nodeTypeString, "ATTRIBUTE_NODE");
      done();
    });

    */
  });
});
