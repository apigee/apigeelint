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

//module that will take a function
//and run that function for every bundle in allBundles.json

var async = require("async"),
  Bundle = require("../../lib/package/Bundle.js"),
  fs = require("fs"),
  allBundles,
  iterate = function(f) {
    async.everySeries(
      allBundles,
      function(folder,cb) {
        var config = {
          debug: true,
          source: {
            type: "filesystem",
            path: folder
          },
          formatter: "table.js"
        };
        var bundle = new Bundle(config);
        f(bundle, cb);
      },
      function(err, result) {
        console.log(result);
      }
    );
  };

module.exports = function(f) {
  if (!allBundles) {
    var result = fs.readFileSync("./test/fixtures/allBundles.json");
    allBundles = JSON.parse(result);
    iterate(f);
  } else {
    iterate(f);
  }
};
