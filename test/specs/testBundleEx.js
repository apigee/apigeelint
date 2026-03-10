/*
  Copyright © 2026 Google LLC

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

const assert = require("node:assert"),
  path = require("node:path"),
  fs = require("node:fs"),
  Bundle = require("../../lib/package/Bundle.js"),
  bundleType = require("../../lib/package/BundleTypes.js");

const subdirnames = [
  bundleType.BundleType.SHAREDFLOW,
  bundleType.BundleType.APIPROXY,
];

describe("BundleEx", function () {
  it("Should correctly identify and build a SharedFlow bundle", function () {
    const sfPath = path.resolve(
      __dirname,
      "../fixtures/resources/sampleFlow/24Solver/sharedflowbundle",
    );
    const configuration = {
      source: {
        type: "filesystem",
        path: sfPath,
        bundleType: "sharedflowbundle",
      },
    };

    let bundle = new Bundle(configuration);
    assert.equal(bundle.bundleTypeName, "sharedflowbundle");

    const endpoints = bundle.getEndpoints();
    // SharedFlow should have SharedFlows, which are treated as proxyEndpoints in the code
    assert.ok(
      bundle.getProxyEndpoints().length > 0,
      "Should have proxy endpoints (SharedFlows)",
    );
    assert.equal(
      bundle.getTargetEndpoints().length,
      0,
      "SharedFlow should have no target endpoints",
    );
    assert.equal(endpoints.length, bundle.getProxyEndpoints().length);
  });

  it("Should flag an error if no apiproxy nor sharedflowbundle", function () {
    const emptyPath = path.resolve(
      __dirname,
      "../fixtures/resources/newBundle",
    );
    const configuration = {
      source: {
        type: "filesystem",
        path: emptyPath,
        bundleType: "apiproxy",
      },
    };

    // The CLI finds the apiproxy or sharedflowbundle dir and appends it;
    // but programs directly using the Bundle() class must specify it.
    let bundle = new Bundle(configuration);
    assert.ok(bundle);
    let report = bundle.getReport();
    assert.ok(report);
    let missingFolderMsg = report[0].messages.find((m) =>
      m.message.includes("No apiproxy folder found"),
    );
    assert.ok(missingFolderMsg, "Should warn about missing apiproxy folder");
  });

  it("Should handle messages without a plugin object", function () {
    const configuration = {
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/sampleProxy/24Solver/apiproxy",
        ),
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);
    bundle.addMessage({ message: "No plugin test", severity: 2 });

    let report = bundle.getReport();
    let msg = report[0].messages.find((m) => m.message === "No plugin test");
    assert.ok(msg);
    assert.equal(msg.severity, 2);
    assert.equal(bundle.report.errorCount, 1);
  });

  it("Should handle messages with plugin but without severity", function () {
    const configuration = {
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/sampleProxy/24Solver/apiproxy",
        ),
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);
    bundle.addMessage({
      plugin: { ruleId: "TEST01", severity: 1 },
      message: "Default severity test",
    });

    let report = bundle.getReport();
    let msg = report[0].messages.find(
      (m) => m.message === "Default severity test",
    );
    assert.ok(msg);
    assert.equal(msg.severity, 1);
  });

  it("Should handle messages without an entity", function () {
    const configuration = {
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/sampleProxy/24Solver/apiproxy",
        ),
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);
    // addMessage will default entity to 'this' (the bundle)
    bundle.addMessage({ message: "Entity test" });
    let report = bundle.getReport();
    // const util = require("util");
    // console.log("report: " + util.format(report[0]));
    let msg = report[0].messages.find((m) => m.message === "Entity test");
    assert.ok(msg);
    assert.ok(msg.source);
  });

  it("Should return 'undefined' for name/revision when XML is missing or malformed", function () {
    // Create a bundle that doesn't really have the XML file it expects
    const configuration = {
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/newBundle/apiproxy",
        ),
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);
    // Manually mess with it to trigger catch blocks if possible,
    // or just rely on the fact that getName/getRevision might fail if we don't have the right structure.
    // In lib/package/Bundle.js:
    // getElement() returns this.element which is populated from the main xml file.

    bundle.element = null; // force failure in getElement() if called
    assert.equal(bundle.getName(), "undefined");
    assert.equal(bundle.getRevision(), "undefined");
  });

  it("Should handle onSteps/onConditions on bundle with no endpoints", function () {
    const configuration = {
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/newBundle/apiproxy",
        ),
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);
    // Mock getProxyEndpoints and getTargetEndpoints to return null/empty
    bundle.getProxyEndpoints = () => null;
    bundle.getTargetEndpoints = () => [];

    bundle.onSteps(
      () => {},
      (err, result) => {
        assert.equal(err, null);
      },
    );

    bundle.onConditions(
      () => {},
      (err, result) => {
        assert.equal(err, null);
      },
    );

    bundle.onResources(
      () => {},
      (err, result) => {
        assert.equal(err, null);
      },
    );

    bundle.onFaultRules(
      () => {},
      (err, result) => {
        assert.equal(err, null);
      },
    );

    bundle.onDefaultFaultRules(
      () => {},
      (err, result) => {
        assert.equal(err, null);
      },
    );
  });

  it("Should exercise summarize() and return a valid summary", function () {
    const proxyPath = path.resolve(
      __dirname,
      "../fixtures/resources/sampleProxy/24Solver/apiproxy",
    );
    const configuration = {
      source: {
        type: "filesystem",
        path: proxyPath,
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);
    const summary = bundle.summarize();
    assert.ok(summary);
    assert.equal(summary.name, "TwentyFour");
    assert.ok(Array.isArray(summary.policies));
    assert.ok(Array.isArray(summary.proxyEndpoints));
    assert.ok(Array.isArray(summary.targetEndpoints));
    assert.ok(Array.isArray(summary.resources));
  });

  it("Should handle multiple XML files at root by throwing an error", function () {
    const tmp = require("tmp");
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    fs.writeFileSync(path.join(tmpDir.name, "one.xml"), "<Proxy/>");
    fs.writeFileSync(path.join(tmpDir.name, "two.xml"), "<Proxy/>");

    const configuration = {
      source: {
        type: "filesystem",
        path: tmpDir.name,
        bundleType: "apiproxy",
      },
    };

    assert.throws(() => {
      new Bundle(configuration);
    }, /more than one .xml file/);
    tmpDir.removeCallback();
  });

  it("Should exercise additional addMessage branches", function () {
    const configuration = {
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/sampleProxy/24Solver/apiproxy",
        ),
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);

    // Entity with getElement but no column
    const mockElement = { lineNumber: 10, columnNumber: 5 };
    const mockEntity = {
      getElement: () => mockElement,
    };
    bundle.addMessage({ entity: mockEntity, message: "Element test" });
    let msg = bundle.report.messages.find((m) => m.message === "Element test");
    assert.equal(msg.line, 10);
    assert.equal(msg.column, 5);

    // Entity with getElement and already has column
    bundle.addMessage({
      entity: mockEntity,
      message: "Column test",
      column: 20,
    });
    msg = bundle.report.messages.find((m) => m.message === "Column test");
    assert.equal(msg.line, 10);
    assert.equal(msg.column, 20);
  });

  it("Should exercise recursive _buildResources", function () {
    const tmp = require("tmp");
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const resourcesDir = path.join(tmpDir.name, "resources");
    fs.mkdirSync(resourcesDir);
    const subDir = path.join(resourcesDir, "jsc");
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, "test.js"), "// test");
    fs.writeFileSync(path.join(resourcesDir, "root.js"), "// root");
    fs.writeFileSync(path.join(resourcesDir, "ignored~"), "// ignore");

    const configuration = {
      source: {
        type: "filesystem",
        path: tmpDir.name,
        bundleType: "apiproxy",
      },
    };
    // Need a dummy .xml at root
    fs.writeFileSync(path.join(tmpDir.name, "bundle.xml"), "<APIProxy/>");

    let bundle = new Bundle(configuration);
    const resources = bundle.getResources();
    assert.ok(resources.find((r) => r.fname === "test.js"));
    assert.ok(resources.find((r) => r.fname === "root.js"));
    assert.ok(!resources.find((r) => r.fname === "ignored~"));

    tmpDir.removeCallback();
  });

  it("Should exercise onSteps/onConditions for targetEndpoints", function () {
    const proxyPath = path.resolve(
      __dirname,
      "../fixtures/resources/sampleProxy/24Solver/apiproxy",
    );
    const configuration = {
      source: {
        type: "filesystem",
        path: proxyPath,
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);

    bundle.onSteps(
      () => {},
      (err) => assert.equal(err, null),
    );
    bundle.onConditions(
      () => {},
      (err) => assert.equal(err, null),
    );
  });

  it("Should exercise the catch block in _buildEndpoints", function () {
    const configuration = {
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/sampleProxy/24Solver/apiproxy",
        ),
        bundleType: "apiproxy",
      },
    };
    let bundle = new Bundle(configuration);
    // Mock readdirSync to throw an error inside _buildEndpoints
    const origReaddir = fs.readdirSync;
    fs.readdirSync = (p) => {
      if (p.includes("proxies")) throw new Error("Mock Error");
      return origReaddir(p);
    };

    try {
      bundle.getProxyEndpoints();
    } finally {
      fs.readdirSync = origReaddir;
    }
  });

  it("Should exercise the catch block in getReport directives", function () {
    const tmp = require("tmp");
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    
    // Create a subdirectory for the malformed file to avoid root XML collision
    const policiesDir = path.join(tmpDir.name, "policies");
    fs.mkdirSync(policiesDir);
    const malformedXml = path.join(policiesDir, "malformed.xml");
    fs.writeFileSync(malformedXml, "<UnclosedTag");

    const configuration = {
      source: {
        type: "filesystem",
        path: tmpDir.name,
        bundleType: "apiproxy",
      },
    };
    // Only one .xml at root
    fs.writeFileSync(path.join(tmpDir.name, "bundle.xml"), "<APIProxy/>");

    let bundle = new Bundle(configuration);
    // Trick getReport into processing the malformed file
    bundle.getPolicies = () => [{
      getReport: () => ({ filePath: malformedXml, messages: [{ ruleId: "R1" }] })
    }];

    bundle.getReport();
    tmpDir.removeCallback();
  });
});
