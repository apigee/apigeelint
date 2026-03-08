/*
Copyright © 2019-2021,2024,2026 Google LLC

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
/* global describe, it, configuration */
/* jslint esversion:9 */

const assert = require("node:assert"),
  path = require("node:path"),
  fs = require("node:fs"),
  debug = require("debug")("apigeelint:Formatters"),
  bl = require("../../lib/package/bundleLinter.js");

function listFiles(directory, filespec) {
  const regex = new RegExp(
    "^" + filespec.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$",
  );

  return fs.readdirSync(directory).filter((file) => {
    const fullPath = path.join(directory, file);
    return fs.statSync(fullPath).isFile() && regex.test(file);
  });
}

const formatters = listFiles("./lib/package/third_party/formatters", "*.js");

function randomString(L) {
  L = L || 18;
  let s = "";
  do {
    s += Math.random().toString(36).substring(2, 15);
  } while (s.length < L);
  return s.substring(0, L);
}

describe("Formatters", function () {
  this.timeout(8000);
  this.slow(3100);
  let capturedOutput = null;
  configuration.source.path =
    "./test/fixtures/resources/sample-proxy-with-issues/response-shaping/apiproxy";
  configuration.output = (formatted) => {
    capturedOutput = formatted;
  };
  debug("test configuration: " + JSON.stringify(configuration));

  it(`Should find formatters`, function () {
    assert.ok(formatters.length >= 13);
  });

  formatters.forEach((formatter) => {
    it(`Formatter ${formatter} should succeed`, function () {
      if (formatter === "pdf.js") {
        this.timeout(18000);
        this.slow(14000);
      }
      try {
        capturedOutput = null;
        configuration.formatter = formatter;
        const bundle = bl.lint(configuration);
        const report = bundle.getReport();
        assert.ok(report);
        assert.ok(capturedOutput);
        //console.log(capturedOutput);
        debug("formatted report: \n" + capturedOutput);
      } catch (e) {
        assert.fail("formatter implementation throws exception: " + e.stack);
      }
    });
  });

  const nonExistingFormatterName = `${randomString(9)}.js`;
  it(`Non-existing Formatter ${nonExistingFormatterName} should fail`, function () {
    try {
      configuration.formatter = nonExistingFormatterName;
      const _bundle = bl.lint(configuration);
      assert.fail("formatter implementation succeeds unexpectedly.");
    } catch (e) {
      assert.ok(e);
      assert.equal(
        e.message,
        `There was a problem loading formatter: ./third_party/formatters/${nonExistingFormatterName}`,
      );
    }
  });
});
