/*
  Copyright 2019-2024 Google LLC

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

const assert = require("assert"),
  path = require("path"),
  Bundle = require("../../lib/package/Bundle.js");

describe("addMessage", function () {
  it("Should add a message for 'undefined' proxies", function () {
    const proxyPath = path.resolve(
      __dirname,
      "../fixtures/resources/newBundle/apiproxy",
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

    const message = "This is a test";
    const plugin = {
      ruleId: "TR001",
      severity: 1, // 1=warning
      nodeType: "Bundle",
    };

    let bundle = new Bundle(configuration);
    bundle.addMessage({ plugin, message });

    bundle.getReport((report) => {
      //console.log(JSON.stringify(report, null, 2));

      let bundleResult = report.find(
        (element) => element.filePath === proxyPath,
      );

      assert.notEqual(bundleResult, null);
      assert.equal(bundleResult.warningCount, 1);
      let m = bundleResult.messages.find(
        (element) => element.message === message,
      );
      assert.equal(m.ruleId, plugin.ruleId);
    });
  });
});
