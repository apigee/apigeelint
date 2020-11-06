/*
  Copyright 2019-2020 Google LLC

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
      debug = require("debug")("apigeelint"),
      Bundle = require("../../lib/package/Bundle.js"),
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js");

debug("test configuration: " + JSON.stringify(configuration));
let bundle = new Bundle(configuration);

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
  formatters.forEach(function(formatter) {
    it(`implementation for ${formatter} should not be undefined`, function() {
      let impl = bl.getFormatter(formatter);
      if (!impl) {
        assert.fail("implementation not defined: " + formatter);
      }
      let report = impl( bundle.getReport() );
      debug("formatted report: \n" + report);
    });
  });
});
