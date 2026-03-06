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
  fs = require("node:fs"),
  tmp = require("tmp"),
  Resource = require("../../lib/package/Resource.js");

describe("Resource", function () {
  let tmpFile;
  const fileContent = "Line 0\nLine 1\nLine 2\nLine 3\nLine 4";

  before(function () {
    tmpFile = tmp.fileSync();
    fs.writeFileSync(tmpFile.name, fileContent);
  });

  after(function () {
    if (tmpFile) tmpFile.removeCallback();
  });

  it("Should correctly initialize and return properties", function () {
    const bundle = { bundletype: "apiproxy" };
    const res = new Resource(bundle, tmpFile.name, "test.js");

    assert.equal(res.getFileName(), "test.js");
    assert.equal(res.getParent(), bundle);
    assert.deepEqual(res.summarize(), { fileName: "test.js" });
  });

  it("Should correctly read contents", function () {
    const bundle = { bundletype: "apiproxy" };
    const res = new Resource(bundle, tmpFile.name, "test.js");

    assert.equal(res.getContents(), fileContent);
    // second call should use cache
    assert.equal(res.getContents(), fileContent);
  });

  it("Should correctly extract line ranges", function () {
    const bundle = { bundletype: "apiproxy" };
    const res = new Resource(bundle, tmpFile.name, "test.js");

    // Single line (Line 1 is index 1)
    assert.equal(res.getLines(1, 1), "Line 1\n");

    // Range
    assert.equal(res.getLines(1, 2), "Line 1\nLine 2\n");

    // Boundary handling - start < 0
    assert.equal(res.getLines(-1, 0), "Line 0\n");

    // Boundary handling - stop > length
    const all = res.getLines(0, 100);
    assert.equal(all, fileContent + "\n");

    // Boundary handling - start > stop
    assert.equal(res.getLines(3, 1), "");
  });

  it("Should handle addMessage with plugin object", function () {
    const bundle = { bundletype: "apiproxy" };
    const res = new Resource(bundle, tmpFile.name, "test.js");

    const plugin = {
      ruleId: "PL001",
      severity: 2,
      nodeType: "Resource",
    };

    res.addMessage({
      plugin,
      message: "Error message",
    });

    const report = res.getReport();
    assert.equal(report.errorCount, 1);
    assert.equal(report.messages.length, 1);
    assert.equal(report.messages[0].ruleId, "PL001");
    assert.equal(report.messages[0].severity, 2);
  });

  it("Should handle addMessage with raw properties and warnings", function () {
    const bundle = { bundletype: "apiproxy" };
    const res = new Resource(bundle, tmpFile.name, "test.js");

    res.addMessage({
      ruleId: "WA001",
      severity: 1,
      message: "Warning message",
    });

    const report = res.getReport();
    assert.equal(report.warningCount, 1);
    // Since each test uses a fresh 'res', the warning should be at index 0
    assert.equal(report.messages[0].ruleId, "WA001");
  });

  it("Should handle entity without getSource or getElement", function () {
    const bundle = { bundletype: "apiproxy" };
    const res = new Resource(bundle, tmpFile.name, "test.js");

    // Pass an entity object that has no methods
    res.addMessage({
      message: "No context",
      entity: {},
    });

    const report = res.getReport();
    const msg = report.messages.find((m) => m.message === "No context");
    assert.ok(msg);
    assert.equal(msg.source, undefined);
    assert.equal(msg.line, undefined);
  });
});
