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

/* global require, describe, before, after, it, __dirname */

const assert = require("assert"),
  Dom = require("@xmldom/xmldom").DOMParser,
  lintUtil = require("../../lib/package/lintUtil.js"),
  util = require("node:util"),
  child_process = require("node:child_process"),
  debug = require("debug")("apigeelint:xmldom-test");

describe("xmldom related tests", function () {
  describe("path resolution verification", function () {
    const path = require("node:path"),
      fs = require("node:fs"),
      proxyDir = path.resolve(__dirname, "../fixtures/resources/issue481"),
      node_modules = path.resolve(proxyDir, "node_modules");

    before(function () {
      fs.rmSync(node_modules, { force: true, recursive: true });
    });
    after(function () {
      fs.rmSync(node_modules, { force: true, recursive: true });
    });

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
      this.timeout(22000);

      const opts = {
        cwd: proxyDir,
        encoding: "utf8",
      };

      if (debug.enabled) {
        const r = child_process.spawnSync("which", ["node"], opts);
        debug(`node: ` + JSON.stringify(r));
      }

      child_process.exec("npm install", opts, (e, stdout, stderr) => {
        assert.equal(e, null);
        debug(stdout);
        // copy current implementation over, to allow testing of it.
        const srcPackageDir = path.resolve(__dirname, "../../lib/package"),
          destPackageDir = path.resolve(node_modules, "apigeelint/lib/package");
        fs.cpSync(srcPackageDir, destPackageDir, { recursive: true });

        try {
          // run apigeelint after npm install
          const proc = child_process.spawn(
            "node",
            ["./node_modules/apigeelint/cli.js", "-s", "sample/apiproxy"],
            { ...opts, timeout: 20000 },
          );
          let stdout = [],
            stderr = [];
          proc.stdout.on("data", (data) => {
            stdout.push(data);
            debug(`stdout: ${data}`);
          });
          proc.stderr.on("data", (data) => {
            stderr.push(data);
            debug(`stderr: ${data}`);
          });
          proc.on("close", (code) => {
            debug(`child process exited with code ${code}`);
            if (code != 0) {
              //console.log(`stdout: ${stdout.join('\n')}`);
              console.log(`stderr: ${stderr.join("\n")}`);
            }
            assert.equal(code, 0);
            done();
          });
        } catch (ex1) {
          console.log(ex1.stack);
          assert.fail();
          done();
        }
      });
    });
  });

  describe("element name tests", function () {
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
});
