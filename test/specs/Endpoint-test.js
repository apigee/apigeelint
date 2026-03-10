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
/* global it, describe */

const ruleId = "PD006",
  assert = require("node:assert"),
  path = require("node:path"),
  fs = require("node:fs"),
  bl = require("../../lib/package/bundleLinter.js"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  Endpoint = require("../../lib/package/Endpoint.js"),
  Dom = require("@xmldom/xmldom").DOMParser;

describe("Endpoint", function () {
  describe("Direct Unit Tests", function () {
    const fixturePath = path.resolve(
      __dirname,
      "../fixtures/resources/PD006/apiproxy/proxies/endpoint1.xml",
    );
    const fixtureContent = fs.readFileSync(fixturePath, "utf-8");

    it("should test getLines extreme boundaries", function () {
      const doc = new Dom().parseFromString(fixtureContent);
      const ep = new Endpoint(doc.documentElement, null, fixturePath);

      // stop > length
      const overStop = ep.getLines(0, 10000);
      assert.ok(overStop.length > 0);

      // stop < 0
      const negStop = ep.getLines(0, -1);
      assert.strictEqual(negStop, fixtureContent.split("\n")[0] + "\n");
    });

    it("should test getSource with nextSibling and lineNumber", function () {
      const xml = `<ProxyEndpoint name="default"><PreFlow/><PostFlow/></ProxyEndpoint>`;
      const doc = new Dom().parseFromString(xml);
      const preFlow = doc.getElementsByTagName("PreFlow")[0];
      const postFlow = doc.getElementsByTagName("PostFlow")[0];
      // Mock line numbers for getSource branch
      preFlow.lineNumber = 1;
      postFlow.lineNumber = 2;

      const ep = new Endpoint(preFlow, null, "test.xml");
      const source = ep.getSource();
      assert.strictEqual(source, 1); // it returns the lineNumber of nextSibling - 1
    });

    it("should test getFlows with attribute-less Flow", function () {
      const xml = `<ProxyEndpoint name="default"><Flows><Flow/></Flows></ProxyEndpoint>`;
      const doc = new Dom().parseFromString(xml);
      const ep = new Endpoint(doc.documentElement, null, "test.xml");
      const flows = ep.getFlows();
      assert.strictEqual(flows.length, 1);
    });

    it("should test onSteps exception handling", function () {
      const xml = `<ProxyEndpoint name="default"><PreFlow/></ProxyEndpoint>`;
      const doc = new Dom().parseFromString(xml);
      const ep = new Endpoint(doc.documentElement, null, "test.xml");

      // Mock getPreFlow to return an object that throws in onSteps
      ep.getPreFlow = () => ({
        onSteps: () => {
          throw new Error("test error");
        },
      });

      let callbackCalled = false;
      ep.onSteps(
        () => {},
        () => {
          callbackCalled = true;
        },
      );
      assert.ok(callbackCalled);
    });

    it("should test onConditions exception handling", function () {
      const xml = `<ProxyEndpoint name="default"><PreFlow/></ProxyEndpoint>`;
      const doc = new Dom().parseFromString(xml);
      const ep = new Endpoint(doc.documentElement, null, "test.xml");

      // Mock getPreFlow to return an object that throws in onConditions
      ep.getPreFlow = () => ({
        onConditions: () => {
          throw new Error("test error");
        },
      });

      let callbackCalled = false;
      ep.onConditions(
        () => {},
        () => {
          callbackCalled = true;
        },
      );
      assert.ok(callbackCalled);
    });

    it("should test getLines extreme boundaries", function () {
      const doc = new Dom().parseFromString(fixtureContent);
      const ep = new Endpoint(doc.documentElement, null, fixturePath);

      // stop > length
      const overStop = ep.getLines(0, 10000);
      assert.ok(overStop.length > 0);

      // stop < 0
      const negStop = ep.getLines(0, -1);
      assert.strictEqual(negStop, fixtureContent.split("\n")[0] + "\n");
    });

    it("should test summarize for apiproxy with FaultRules", function () {
      const pathToFRProxy = path.resolve(
        __dirname,
        "../fixtures/resources/FR-checks/apiproxy",
      );
      const configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: pathToFRProxy,
          bundleType: "apiproxy",
        },
        profile: "apigeex",
        excluded: {},
        setExitCode: false,
        output: () => {},
      };

      bl.lint(configuration, (bundle) => {
        const ep = bundle.getEndpoints()[0];
        assert.ok(ep);
        const summary = ep.summarize();
        assert.ok(summary.faultRules);
        assert.strictEqual(summary.faultRules.length, 1);
        assert.strictEqual(summary.faultRules[0].name, "rule1");
      });
    });

    // it("should test summarize for minimal apiproxy", function () {
    //   const xml = `<ProxyEndpoint name="minimal"/>`;
    //   const doc = new Dom().parseFromString(xml);
    //   const ep = new Endpoint(doc.documentElement, null, "minimal.xml", "apiproxy");
    //   const summary = ep.summarize();

    //       assert.strictEqual(summary.name, "minimal");
    //   assert.deepEqual(summary.preFlow, {});
    //   assert.deepEqual(summary.postFlow, {});
    //   assert.deepEqual(summary.flows, []);
    //   assert.deepEqual(summary.routeRules, []);
    // });
    it("should test sorting in getReport with mixed line/column info", function () {
      const xml = `<ProxyEndpoint name="default"/>`;
      const doc = new Dom().parseFromString(xml);
      const ep = new Endpoint(doc.documentElement, null, "test.xml");

      // This particular set of combinations is intended to
      // exercise all the sorting possibilities in getReport().
      ep.addMessage({ line: 10, column: 5, message: "m1" });
      ep.addMessage({ line: 11, column: 2, message: "m2" });
      ep.addMessage({ line: 5, message: "m3" });
      ep.addMessage({ line: 5, column: 7, message: "m4" });
      ep.addMessage({ line: 6, column: 6, message: "m5" });
      ep.addMessage({ line: 6, message: "m6" });
      ep.addMessage({ message: "m7" });
      ep.addMessage({ message: "m8" });
      ep.addMessage({ line: 10, column: 2, message: "m9" });

      const report = ep.getReport();
      const messages = report.messages;

      assert.strictEqual(messages[0].message, "m7");
      assert.strictEqual(messages[1].message, "m8");
      assert.strictEqual(messages[2].message, "m3");
      assert.strictEqual(messages[3].message, "m4");
      assert.strictEqual(messages[4].message, "m6");
      assert.strictEqual(messages[5].message, "m5");
      assert.strictEqual(messages[6].message, "m9");
      assert.strictEqual(messages[7].message, "m1");
      assert.strictEqual(messages[8].message, "m2");
    });
  });

  describe("apiproxy", function () {
    const pathToProxy = path.resolve(
        __dirname,
        "../fixtures/resources/PD006/apiproxy",
      ),
      configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: pathToProxy,
          bundleType: "apiproxy",
        },
        profile: "apigeex",
        excluded: {},
        setExitCode: false,
        output: () => {}, // suppress output
      };

    bl.lint(configuration, (bundle) => {
      it("should test getLines and getSource", function () {
        // const doc = new Dom({
        //   locator: {
        //     systemId: path.resolve(pathToProxy, "proxies/endpoint1.xml"),
        //   },
        // }).parseFromString(fixtureContent);
        const fixturePath = path.resolve(pathToProxy, "proxies/endpoint1.xml"),
          fixtureContent = fs.readFileSync(fixturePath, "utf-8");

        const ep = bundle.getEndpoints()[0];
        assert.ok(ep);

        // Test getLines boundaries
        const allLines = ep.getLines();
        assert.ok(allLines.length > 0);

        const firstLine = ep.getLines(0, 1);
        assert.strictEqual(
          firstLine.trim(),
          fixtureContent.split("\n")[0].trim(),
        );

        // Test out of bounds
        const outOfBounds = ep.getLines(-1, 10000);
        assert.ok(outOfBounds.length > 0);

        const startGtStop = ep.getLines(10, 5);
        assert.strictEqual(
          startGtStop.trim(),
          fixtureContent.split("\n")[5].trim(),
        );

        // Test getSource
        const source = ep.getSource();
        assert.ok(source.includes('<ProxyEndpoint name="default">'));
      });

      it("should exercise caching in #getFlow (for coverage)", function () {
        const ep = bundle.getEndpoints()[1];
        assert.ok(ep);
        const preFlow1 = ep.getPreFlow();
        assert.ok(preFlow1);
        const preFlow2 = ep.getPreFlow();
        assert.strictEqual(preFlow1, preFlow2, "Should return cached flow");
      });

      it("should test addMessage with different options", function () {
        const ep = bundle.getEndpoints()[0];
        assert.ok(ep);

        const originalErrorCount = ep.getReport().errorCount;

        // Message with plugin
        ep.addMessage({
          plugin: {
            ruleId: "TEST001",
            severity: 2,
            nodeType: "Endpoint",
          },
          message: "Test message",
        });

        const report = ep.getReport();
        assert.strictEqual(report.errorCount, 1 + originalErrorCount);
        let foundMsg = report.messages.find((m) => m.ruleId == "TEST001");
        assert.ok(foundMsg);
        assert.strictEqual(foundMsg.severity, 2);

        const originalWarningCount = ep.getReport().warningCount;
        // Message with warning severity
        ep.addMessage({
          ruleId: "TEST002",
          severity: 1,
          message: "Warning message",
        });
        assert.strictEqual(
          ep.getReport().warningCount,
          originalWarningCount + 1,
        );

        // Message with entity and location info
        const mockEntity = {
          getSource: () => "mock source",
          getElement: () => ({ lineNumber: 10, columnNumber: 5 }),
        };
        // Ensure they are own properties for hasOwnProperty check
        Object.defineProperty(mockEntity, "getSource", {
          value: () => "mock source",
          enumerable: true,
        });
        Object.defineProperty(mockEntity, "getElement", {
          value: () => ({ lineNumber: 10, columnNumber: 5 }),
          enumerable: true,
        });

        ep.addMessage({
          ruleId: "TEST003",
          severity: 1,
          message: "Entity message",
          entity: mockEntity,
        });
        foundMsg = ep.getReport().messages.find((m) => m.ruleId == "TEST003");
        assert.strictEqual(foundMsg.source, "mock source");
        assert.strictEqual(foundMsg.line, 10);
        assert.strictEqual(foundMsg.column, 5);
      });

      it("should test summarize for apiproxy", function () {
        bundle.getEndpoints().forEach((ep, ix) => {
          assert.ok(ep);
          const summary = ep.summarize();

          if (ix == 0) {
            assert.strictEqual(summary.name, "default");
            assert.strictEqual(summary.type, "ProxyEndpoint");
            assert.ok(summary.preFlow);
            assert.strictEqual(summary.flows.length, 5);
            assert.strictEqual(summary.flows[0].name, "airlines32");
            assert.ok(summary.postFlow);
            assert.strictEqual(summary.routeRules.length, 1);
          }
        });
      });
    });
  });

  describe("sharedflow", function () {
    const pathToSharedflow = path.resolve(
      __dirname,
      "../fixtures/resources/sampleFlow/24Solver/sharedflowbundle",
    );
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: pathToSharedflow,
        bundleType: "sharedflowbundle",
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      it("should test summarize for sharedflowbundle", function () {
        const ep = bundle.getEndpoints()[0];
        assert.ok(ep);
        const summary = ep.summarize();
        assert.strictEqual(summary.name, "default");
        assert.ok(summary.flows);
        assert.strictEqual(summary.flows.length, 1);
      });

      it("should test getSteps", function () {
        const ep = bundle.getEndpoints()[0];
        assert.ok(ep);
        const steps = ep.getSteps();
        assert.strictEqual(steps.length, 9); // including an erroneous, empty one
      });

      it("should test onSteps and onConditions with sharedflow", function () {
        const ep = bundle.getEndpoints()[0];
        assert.ok(ep);

        let stepCount = 0;
        ep.onSteps(() => stepCount++);
        assert.strictEqual(stepCount, 9);

        let condCount = 0;
        ep.onConditions(() => condCount++);
        assert.strictEqual(condCount, 4);
      });
    });
  });
});
