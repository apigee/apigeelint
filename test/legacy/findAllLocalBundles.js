//findAllLocalBundles
var debug = require("debug")("bundlelinter:findAllLocalBundles"),
  fs = require("fs"),
  path = require("path"),
  cwd = process.cwd(),
  FindFolder = require("node-find-folder"),
  os = require("os"),
  rootDir = os.homedir() + "/Projects/",
  result = [];

process.chdir(rootDir);
var folders = new FindFolder("apiproxy");
process.chdir(cwd);
folders.forEach(function(folder) {
  result.push(rootDir + folder);
});

console.log(result);
//write it to  ./test/fixtues/allBundles.json

fs.writeFile(
  "./test/fixtures/allBundles.json",
  JSON.stringify(result),
  function(err) {
    if (err) {
      console.log(err);
    }
  }
);
