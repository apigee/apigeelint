var assert = require("assert"),
  bl = require("../lib/package/bundleLinter.js"),
  ManagementServer = require("../lib/package/ManagementServer.js");

var config = {
  debug: true,
  source: {
    type: "ManagementServer",
    org: "davidwallen2014",
    api: "24Solver",
<<<<<<< HEAD
    revision: 19
=======
    revision: 19,
    authorization: "Basic User:Secret="
>>>>>>> 519bad064cbda48bfaed21c434f3a8ed21e6a09b
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
