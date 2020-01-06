/*
  Copyright 2019 Google LLC

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

var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  debug = require("debug")("bundlelinter"),
  Bundle = require("../../lib/package/Bundle.js"),
  util = require("util"),
  bl = require("../../lib/package/bundleLinter.js"),
  bundle;

debug("test configuration: " + JSON.stringify(configuration));
bundle = new Bundle(configuration);

var formatters = [
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

formatters.forEach(function(formatter) {
  describe(formatter, function() {
    describe("getting implementation", function() {
      it("implementation should not be undefined", function() {
        var impl = bl.getFormatter(formatter);
        if (!impl) {
          assert("implementation not defined: " + impl);
        } else {
          var report = impl(
            bundle.getReport(debug("unix formatted report: \n" + report))
          );
        }
      });
    });
  });
});
