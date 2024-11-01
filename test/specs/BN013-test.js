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
/* global configuration, describe, it */
const assert = require("assert"),
  path = require("path"),
  util = require("util"),
  testID = "BN013",
  debug = require("debug")("apigeelint:${testID}-test"),
  //Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js");

describe("BN013 - Check for unreferenced resources", function () {
  it("should flag unused resources in bundle1", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/BN013/bundle1/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    debug("test configuration: " + JSON.stringify(configuration));
    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      assert.ok(actualErrors.length);
      debug(util.format(actualErrors));
      debug("First error: " + util.format(actualErrors[0]));

      const bn013Items = actualErrors.filter((e) =>
        e.messages.find((m) => m.ruleId == "BN013")
      );

      debug("BN013 items: " + util.format(bn013Items));
      assert.equal(bn013Items.length, 1);
      debug(util.format(bn013Items[0]));
      assert.ok(bn013Items[0].messages);

      // disregard all warnings or errors except those from this plugin
      bn013Items[0].messages = bn013Items[0].messages.filter(
        (m) => m.ruleId == "BN013"
      );

      const expected = [
        "xsl/sheet2.xsl",
        "jsc/sourceFile3.js",
        "wsdl/example3.wsdl",
        "py/setHeader3.py",
        "xsd/example2.xsd",
        "oas/example2.yaml",
        "java/xeger-1.0.jar"
      ];
      assert.equal(bn013Items[0].messages.length, expected.length);
      for (let i = 0; i < expected.length; i++) {
        assert.ok(
          expected.find(
            (rsrc) =>
              bn013Items[0].messages[i].message ==
              `Unreferenced resource ${rsrc}. There are no policies that reference this resource.`
          )
        );
      }
    });
  });

  it("should flag no issues in test-issue482", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/BN013/test-issue482/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    debug("test configuration: " + JSON.stringify(configuration));
    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      debug(util.format(actualErrors));
      const bn013Items = actualErrors.filter((e) =>
        e.messages.find((m) => m.ruleId == "BN013")
      );
      debug("BN013 items: " + util.format(bn013Items));
      assert.equal(bn013Items.length, 0);
    });
  });


});
