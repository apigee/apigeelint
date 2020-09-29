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
  fs = require("fs"),
  path = require("path"),
  debug = require("debug")("apigeelint:dumpBundle"),
  FindFolder = require("node-find-folder"),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  rootDir = "/Users/davidwallen/Projects/",
  cwd = process.cwd();

process.chdir(rootDir);
var folders = new FindFolder("apiproxy");
process.chdir(cwd);

folders.forEach(function(folder) {
  var config = {
    debug: true,
    source: {
      type: "filesystem",
      path: rootDir + folder
    },
    excluded: {},
    formatter: "table.js"
  };
  var bundle = new Bundle(config);
  it("should not blow chunks dumping " + config.source.path, function() {
    debug(bundle.summarize());
  });
});
