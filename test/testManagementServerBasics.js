var ManagementServer = require("../lib/package/ManagementServer.js"),
  debug = require("debug")("bundlelinter:ManagementServer"),
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
