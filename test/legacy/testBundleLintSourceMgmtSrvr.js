var assert = require("assert"),
  bl = require("../../lib/package/bundleLinter.js"),
  ManagementServer = require("../../lib/package/ManagementServer.js");

var config = {
  debug: true,
  source: {
    type: "ManagementServer",
    org: "davidwallen2014",
    api: "24Solver",
    revision: 19,
    authorization: "Basic User:Secret="
  },
  formatter: "unix.js"
};

describe("testing source of managementserver", function() {
  it("not blow chunks ", function(done) {
    bl.lint(config, function() {
      done();
    });
  });
});
