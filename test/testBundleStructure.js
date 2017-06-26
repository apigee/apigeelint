//testBundleStructure.js

//call the plugin against an arbitrary folder
var myUtil = require("../myUtil.js"),
    bs = require("../plugins/bundleStructure.js");
test = function(root) {
	var results = {root,warnings:[]};

    bs.onBundle({
        root,
        proxyRoot: "apiproxy",
        warn(warning) { results.warnings.push(warning); }
    });
    myUtil.inspect(results);
};

//process.chdir("/Users/davidallen/Projects/");
process.chdir("/Users/davidallen/Projects/samples/");

var FindFolder = require("node-find-folder"),
    folders = new FindFolder("apiproxy/proxies");

folders.some(function(folder) {
    if (folder.indexOf("target/") === -1) {
        //drop the apiproxy off the end
        test(folder.substring(0, folder.length - 17));
    }
});
