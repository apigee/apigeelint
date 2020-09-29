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

var debug = require("debug")("apigeelint:findAllLocalBundles"),
  fs = require("fs"),
  path = require("path"),
  cwd = process.cwd(),
  FindFolder = require("node-find-folder"),
  os = require("os"),
  rootDir = os.homedir() + "/Projects/",
  result = [];

process.chdir(rootDir);
var folders = new FindFolder("apiproxy");
process.chdir(cwd);
folders.forEach(function(folder) {
  result.push(rootDir + folder);
});

console.log(result);
//write it to  ./test/fixtues/allBundles.json

fs.writeFile(
  "./test/fixtures/allBundles.json",
  JSON.stringify(result),
  function(err) {
    if (err) {
      console.log(err);
    }
  }
);
