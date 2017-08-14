var ManagementServer = require("../lib/package/ManagementServer.js"),
  debug = require("debug")("bundlelinter:ManagementServer"),
  assert = require("assert"),
  mgmtConfig = {};

function test(org, api, revision, expectedSize) {
  describe("download a bundle.", function() {
    var ms = new ManagementServer(mgmtConfig);
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
