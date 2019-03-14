var assert = require("assert"),
  bl = require("../../lib/package/bundleLinter.js");

bl.lint({
  debug: true,
  source: {
    type: "filesystem",
    path:
      "test/sampleProxy/24Solver/apiproxy"
  },
  excluded: {},
  formatter: "unix.js",
  apiUpload: {
    destPath: "https://csdata-test.apigee.net/v1/lintresults",
    user: process.env.au,
    password: process.env.as,
    organization: "csdata"
  }
});
