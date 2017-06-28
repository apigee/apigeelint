//dumpBundle.js

var Bundle = require("../lib/package/Bundle.js"),
    myUtil = require("../lib/package/myUtil.js");

var configuration = {
    debug: true,
    "source": {
        "type": "filesystem",
        //"path": "../../../sampleProxy",
        "path": "/Users/davidwallen/Projects/apigee-bbcww-store/gateway/Store/target/apiproxy",
    }
};

var bundle = new Bundle(configuration);

myUtil.inspect(bundle.summarize());
