var bl = require("./package/bundleLinter.js"),
util = require("util");


var configuration = {
    debug: true,
    "source": {
        "type": "filesystem",
        "path": "./sampleProxy",
    },
    plugins: ['bundleStructure.js']
};

console.log(util.inspect(bl.lint(configuration), { showHidden: false, depth: 9, maxArrayLength: 100 }));