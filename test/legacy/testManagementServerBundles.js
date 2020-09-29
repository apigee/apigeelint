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

var ManagementServer = require("../../lib/package/ManagementServer.js"),
  debug = require("debug")("apigeelint:ManagementServer"),
  assert = require("assert");

function test(org, api, revision, expectedSize) {
  describe("download a bundle.", function() {
    var ms = new ManagementServer(org);
    it("bundle size should be " + expectedSize + " bytes.", function(done) {
      ms.get("Bundle", { org }, { api, revision }, function(body, res) {
        var size = body.length;
        try {
          assert.equal(size, expectedSize);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
}

test("davidwallen2014", "24Solver", "19", 4148);
test("davidwallen2014", "twitterPerspective", "15", 5210);
test("davidwallen2014", "badSSL", "3", 1633);
