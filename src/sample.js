var bl = require("./package/bundleLinter.js");

var configuration = {
    debug: true,
    "source": {
        "type": "filesystem",
        "path": "../sampleProxy",
    },
    //plugins: ['checkFileName.js']
};

bl.lint(configuration);