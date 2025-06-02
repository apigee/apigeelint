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

const assert = require("node:assert"),
  path = require("node:path"),
  debug = require("debug")(`apigeelint:step-get-test`),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js");

const getConfig = (partialProxyPath) => {
  const proxyPath = path.resolve(
    __dirname,
    "../fixtures/resources",
    partialProxyPath,
    "apiproxy",
  );
  const configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: proxyPath,
      sourcePath: proxyPath,
      bundleType: "apiproxy",
    },
    profile: "apigee",
    excluded: {},
    setExitCode: false,
    output: () => {}, // suppress output
  };
  return configuration;
};

describe("step-get Bundle", function () {
  it("Should return the bundle from every step", function () {
    let configuration = getConfig("sampleProxy/24Solver");
    let bundle = new Bundle(configuration);
    let endpoints = [
      ...bundle.getProxyEndpoints(),
      ...bundle.getTargetEndpoints(),
    ];
    endpoints.forEach((endpt) => {
      debug(`endpt ${endpt.constructor.name}`);
      let steps = endpt.getSteps();
      let foundBundleCount = steps.reduce((acc, step) => {
        if (step.getBundle() == bundle) {
          acc++;
        }
        return acc;
      }, 0);
      assert.equal(foundBundleCount, steps.length);
    });
  });
});

describe("step-get Policy", function () {
  it("Should return the policy for any step that refers to a real policy", function () {
    let configuration = getConfig("step-get-sample-proxy");
    let bundle = new Bundle(configuration);

    // look for missing policies
    bl.executePlugin("BN010", bundle);
    let reportItems = bundle.getReport();
    debug(`reportItems: ${JSON.stringify(reportItems)}`);
    let bn010Errors = reportItems.filter(
      (item) =>
        item.messages &&
        item.messages.length &&
        item.messages.find((m) => m.ruleId == "BN010"),
    );
    debug(`found: ${bn010Errors.length} Step(s) with missing policies`);

    let endpoints = [
      ...bundle.getProxyEndpoints(),
      ...bundle.getTargetEndpoints(),
    ];
    endpoints.forEach((endpt) => {
      debug(`endpt ${endpt.constructor.name}`);
      let steps = endpt.getSteps();
      let resolvedPolicies = steps
        .map((step) => [step, step.resolvePolicy()])
        .filter(([s, p]) => !!p);

      assert.equal(resolvedPolicies.length, steps.length - bn010Errors.length);

      resolvedPolicies.forEach(([step, policy]) => {
        assert.ok(policy.getSteps().find((s) => s == step));
      });
    });
  });
});
