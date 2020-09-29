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
  debug = require("debug")("apigeelint:flowNames");

var Policy = require("../../lib/package/Policy.js"),
  test = function(folder,file, assertion) {
    it("testing policy names ", function() {
      //function Policy(path, fn, parent)
      var policy = new Policy(folder, file, this);

      result = policy.getDisplayName();

      assert.deepEqual(
        result,
        assertion,
        result ? "names did not match" : "names matched"
      );
    });
  };

describe("Test Policy Names From FS", function() {

  test(
    "./test/fixtures/","JS-Log-To-Stackdriver.xml",
    "JS-Log-To-Stackdriver"
  );

});
