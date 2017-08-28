var assert = require("assert"),
  bl = require("../lib/package/bundleLinter.js"),
  ManagementServer = require("../lib/package/ManagementServer.js");

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
