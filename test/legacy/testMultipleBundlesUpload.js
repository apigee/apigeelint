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
  schema = require("./../fixtures/reportSchema.js"),
  Validator = require("jsonschema").Validator,
  pluginPath = path.join(__dirname, "../lib/package/plugins"),
  plugins = [],
  cwd = process.cwd(),
  debug = require("debug")("apigeelint:tetMultipleBundlesUpload");

fs.readdirSync(pluginPath).forEach(function(file) {
  plugins.push(file);
});

var FindFolder = require("node-find-folder"),
  path = require("path"),
  bl = require("../../lib/package/bundleLinter.js"),
  rootDir = "/Users/davidwallen/Projects/samples/";

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
    formatter: "unix.js",
    output: debug,
    apiUpload: {
      destPath: "https://csdata-test.apigee.net/v1/lintresults",
      user: process.env.au,
      password: process.env.as,
      organization: "csdata"
    }
  };
  it(
    "should not blow chunks linting and uploading " + config.source.path,
    function() {
      this.timeout(20000);
      bl.lint(config);
    }
  );
});

Promise.all(folders)
  .then(function() {
    console.log("completed)");
  })
  .catch(console.error);
