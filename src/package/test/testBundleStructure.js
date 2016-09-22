//testBundleStructure.js

//call the plugin against an arbitrary folder
var myUtil = require("../myUtil.js"),
    bs = require("../plugins/bundleStructure.js"),
    test = function(root) {
        bs.onBundle({
            root,
            proxyRoot: "apiproxy",
            warn: myUtil.inspect
        });
    };

//test("/Users/davidallen/Projects/cambia/Plans/");


//now lets get really fancy and check structure on every bundle in my current projects folder
process.chdir("/Users/davidallen/Projects/");

var FindFolder = require("node-find-folder"),
    folders = new FindFolder("apiproxy/proxies");

folders.some(function(folder) {
    if (folder.indexOf("target/") === -1) {
        //drop the apiproxy off the end
        test(folder.substring(0, folder.length - 17));
    }
});
