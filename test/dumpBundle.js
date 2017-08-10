//dumpBundle.js

var Bundle = require("../lib/package/Bundle.js"),
  debug = require("debug")("bundlelinter:dumpBundle");

var configuration = {
  debug: true,
  source: {
    type: "filesystem",
    //"path": "../../../sampleProxy",
    path:
      "/Users/davidwallen/Projects/bundle-linter/tmp/tmobileprd-web-auth-71-808/apiproxy"
  }
};

var bundle = new Bundle(configuration);

console.log(bundle.summarize());
var  bl = require("../lib/package/bundleLinter.js");
bl.lint(configuration);

