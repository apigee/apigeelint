var assert = require("assert"),
  bl = require("../lib/package/bundleLinter.js");

bl.lint({
  debug: true,
  source: {
    type: "filesystem",
    path:
      "/Users/davidwallen/Projects/bundle-linter/test/sampleProxy/24Solver/apiproxy"
  },
  formatter: "unix.js",
  apiUpload: {
    destPath: "https://csdata-test.apigee.net/v1/lintresults",
    user: process.env.au,
    password: process.env.as,
    organization: "csdata"
  }
});
