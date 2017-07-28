//dumpBundle.js

var Bundle = require("../lib/package/Bundle.js"),
  debug = require("debug")("bundlelinter:dumpBundle");

var configuration = {
  debug: true,
  source: {
    type: "filesystem",
    //"path": "../../../sampleProxy",
    path:
      "/Users/davidwallen/Projects/apigee-bbcww-store/gateway/Store/target/apiproxy"
  }
};

var bundle = new Bundle(configuration);

debug(bundle.summarize());
