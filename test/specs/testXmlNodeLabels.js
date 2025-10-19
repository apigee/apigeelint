/*
  Copyright © 2024-2025 Google LLC

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

describe("xmldom path resolution verification", function () {
  this.slow(11000);
  const path = require("node:path"),
    fs = require("node:fs"),
    proxyDir = path.resolve(__dirname, "../fixtures/resources/issue481"),
    node_modules = path.resolve(proxyDir, "node_modules"),
    packageLock = path.resolve(proxyDir, "package-lock.json");

  const cleanup = (done) => {
    fs.rmSync(node_modules, { force: true, recursive: true });
    fs.rmSync(packageLock, { force: true });
    done();
  };
  before(function (done) {
    // remove node_modules before the test runs. We want a clean install.
    cleanup(done);
  });

  after(function (done) {
    // tidy up after the test runs.
    this.timeout(8000);
    // Sometimes this gets hung and fails. It seems it's a race condition.
    // Trying a timeout to avoid that.
    setTimeout(() => cleanup(done), 2000);
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
    this.timeout(58000);
    const opts = {
      cwd: proxyDir,
      encoding: "utf8",
    };

    if (debug.enabled) {
      const r = child_process.spawnSync("which", ["node"], opts);
      debug(`node: ` + JSON.stringify(r));
    }

    //  npm install can take a very long time, sometimes.
    child_process.exec("npm install", opts, (e, stdout, stderr) => {
      assert.equal(e, null);
      debug(stdout);
      // copy current implementation over, to allow testing of it.
      const srcPackageDir = path.resolve(__dirname, "../../lib/package"),
        destPackageDir = path.resolve(node_modules, "apigeelint/lib/package");
      // overwrite the installed apigeelint with the current (working) version
      fs.cpSync(srcPackageDir, destPackageDir, { recursive: true });

      try {
        // run apigeelint after npm install
        const proc = child_process.spawn(
          "node",
          ["./node_modules/apigeelint/cli.js", "-s", "sample/apiproxy"],
          { ...opts, timeout: 20000 },
        );
        let stdoutBlobs = [],
          stderrBlobs = [];
        proc.stdout.on("data", (data) => {
          stdoutBlobs.push(data);
          debug(`stdout: ${data}`);
        });
        proc.stderr.on("data", (data) => {
          stderrBlobs.push(data);
          debug(`stderr: ${data}`);
        });
        proc.on("exit", (exitCode) => debug(`exit: ${exitCode}`));
        proc.on("error", (error) => console.error(`process error: ${error}`));
        proc.on("close", (code) => {
          debug(`child process exited with code ${code}`);
          let aggregatedErrorMessages = stderrBlobs.join("");
          if (code != 0) {
            console.log(`stderr: ${aggregatedErrorMessages}`);
          }
          assert.equal(code, 0, "return status code");
          done();
        });
      } catch (ex1) {
        console.log(ex1.stack);
        assert.fail();
      }
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
