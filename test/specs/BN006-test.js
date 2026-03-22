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

const ruleId = "BN006",
  assert = require("node:assert"),
  path = require("node:path"),
  fs = require("node:fs"),
  tmp = require("tmp"),
  bl = require("../../lib/package/bundleLinter.js");

describe(`BN006 - bundle exceeding policy count`, function () {
  this.timeout(11000);
  this.slow(5200);
  const createBundleInTempDir = (policyCount) => {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const templatePath = path.resolve(
      __dirname,
      "../fixtures/resources/BN006-template",
    );
    const apiproxyPath = path.join(tmpDir.name, "apiproxy");

    // Copy template
    fs.cpSync(templatePath, tmpDir.name, { recursive: true });

    const policiesDir = path.join(apiproxyPath, "policies");
    const amVariable0Path = path.join(policiesDir, "AM-Variable-0.xml");
    const amVariable0Content = fs.readFileSync(amVariable0Path, "utf8");

    const existingPolicies = fs
      .readdirSync(policiesDir)
      .filter((f) => f.endsWith(".xml"));
    const numToAdd = policyCount - existingPolicies.length;
    const steps = [];
    steps.push(`      <Step><Name>AM-Variable-0</Name></Step>`);

    for (let i = 1; i <= numToAdd; i++) {
      const policyName = `AM-Variable-${i}`;
      const policyContent = amVariable0Content
        .replace(/AM-Variable-0/g, policyName)
        .replace(/variable0/g, `variable${i}`);
      fs.writeFileSync(
        path.join(policiesDir, `${policyName}.xml`),
        policyContent,
      );
      steps.push(`      <Step><Name>${policyName}</Name></Step>`);
    }

    // Update endpoint1.xml
    const proxyEndpointPath = path.join(
      apiproxyPath,
      "proxies",
      "endpoint1.xml",
    );
    let proxyEndpointContent = fs.readFileSync(proxyEndpointPath, "utf8");
    const preFlowRequestReplacement = `<Request>\n${steps.join("\n")}\n    </Request>`;
    proxyEndpointContent = proxyEndpointContent.replace(
      /<Request>\s*<\/Request>/,
      preFlowRequestReplacement,
    );
    fs.writeFileSync(proxyEndpointPath, proxyEndpointContent);

    return apiproxyPath;
  };

  const runOne = (policyCount, expectedNumberOfIssues, policyCountLimit) => {
    const bundlePath = createBundleInTempDir(policyCount);
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: bundlePath,
        bundleType: "apiproxy",
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };
    if (policyCountLimit) {
      configuration.policyCountLimit = policyCountLimit;
    }

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualIssues = items.filter(
        (item) =>
          item.messages &&
          item.messages.length &&
          item.messages.find((m) => m.ruleId == ruleId),
      );
      assert.equal(actualIssues.length, expectedNumberOfIssues);
    });
  };

  it("should generate the expected BN006 error", function () {
    runOne(101, 1);
  });
  it("should generate the expected BN006 error", function () {
    runOne(121, 1);
  });
  it("should not generate any BN006 error", function () {
    runOne(100, 0);
  });
  it("should not generate any BN006 error again", function () {
    runOne(99, 0);
  });
  it("should generate the expected BN006 error again again", function () {
    runOne(9, 0);
  });
  it("should generate the expected BN006 error with limit of 20", function () {
    runOne(21, 1, 20);
  });
});
