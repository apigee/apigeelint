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
  bl = require("../../lib/package/bundleLinter.js"),
  ManagementServer = require("../../lib/package/ManagementServer.js");

var config = {
  debug: true,
  source: {
    type: "ManagementServer",
    org: "davidwallen2014",
    api: "FooBar",
    revision: 999
  },
  formatter: "unix.js"
};

describe("testing source of managementserver", function() {
  it("returns 404 ", function(done) {
    bl.lint(config, function(result, err) {
      assert.equal(err.status,404);
      done();
    });
  });
});
