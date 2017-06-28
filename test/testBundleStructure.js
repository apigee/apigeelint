//testBundleStructure.js

//call the plugin against an arbitrary folder
var myUtil = require("../lib/package/myUtil.js"),
  bs = require("../lib/package/plugins/bundleStructure.js");

test = function(root) {
  var results = { root, warnings: [] };

  bs.onBundle({
    root,
    proxyRoot: root + "/" + "apiproxy",
    warn(warning) {
      results.warnings.push(warning);
    }
  });
  myUtil.inspect(results);
};

//process.chdir("/Users/davidallen/Projects/");
var rootDir = "/Users/davidwallen/Projects/samples/";
process.chdir(rootDir);

var FindFolder = require("node-find-folder"),
  folders = new FindFolder("apiproxy/proxies");

folders.some(function(folder) {
  if (folder.indexOf("target/") === -1) {
    //drop the apiproxy off the end
    console.log(folder);
    test(rootDir + folder.substring(0, folder.length - 17));
  }
});
