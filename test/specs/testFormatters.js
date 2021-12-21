/*
  Copyright 2019-2021 Google LLC

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

const assert = require("assert"),
      debug = require("debug")("apigeelint:Formatters"),
      //Bundle = require("../../lib/package/Bundle.js"),
      //util = require("util"),
      bl = require("../../lib/package/bundleLinter.js");

const formatters = [
  "checkstyle.js",
  "codeframe.js",
  "compact.js",
  "html.js",
  "jslint-xml.js",
  "json.js",
  "junit.js",
  "stylish.js",
  "table.js",
  "tap.js",
  "unix.js",
  "visualstudio.js",
  "pdf.js"
];

describe("Formatters", function() {
  configuration.source.path = './test/fixtures/resources/sample-proxy-with-issues/response-shaping/apiproxy';
  configuration.output = () => {}; // suppress output
  debug("test configuration: " + JSON.stringify(configuration));

  formatters.forEach( formatter => {
    it(`Linting with formatter ${formatter} should succeed`, function() {
      configuration.formatter = formatter;
      let bundle = bl.lint(configuration);
      let report = bundle.getReport();
      assert.ok(report);
      debug("formatted report: \n" + report);
    });
  });
});
