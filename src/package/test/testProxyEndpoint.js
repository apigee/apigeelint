//testEndpoint.js

var Bundle = require("../Bundle.js"),
    myUtil = require("../myUtil.js");

var configuration = {
    debug: true,
    "source": {
        "type": "filesystem",
        //"path": "../../../sampleProxy",
        "path": "/Users/davidallen/Projects/apigee-bbcww-store/gateway/Store/target",
    }
};

bundle = new Bundle(configuration);
myUtil.inspect(bundle.summarize());
