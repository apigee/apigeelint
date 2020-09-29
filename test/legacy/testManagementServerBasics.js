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
  assert = require("assert"),
  mgmtConfig = {};

function test(desc, call, org, testFunction, testResult) {
  describe("test: " + desc, function() {
    it("should return " + testResult, function(done) {
      var ms = new ManagementServer(org);
      ms.get(call, { org }, [], function(body, res) {
        var actualResult;
        if (typeof testFunction == "function") {
          actualResult = testFunction(body, res);
        } else {
          actualResult = testFunction;
        }
        try {
          assert.equal(testResult, actualResult);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
}

test(
  "Test Authorization via status code.",
  "Enviros",
  "davidwallen2014",
  function(body, res) {
    return res.statusCode;
  },
  200
);

test(
  "Number of Enviros in org.",
  "Enviros",
  "davidwallen2014",
  function(body, res) {
    return JSON.parse(body).length || 0;
  },
  2
);
test(
  "Enviros contains test.",
  "Enviros",
  "davidwallen2014",
  function(body, res) {
    return body.indexOf("test") > -1;
  },
  true
);

test(
  "APIs include 24Solver.",
  "OrgAPIs",
  "davidwallen2014",
  function(body, res) {
    return body.indexOf("24Solver") > -1;
  },
  true
);
