var assert = require("assert"),
  fs = require("fs"),
  path = require("path"),
  schema = require("./reportSchema.js"),
  Validator = require("jsonschema").Validator,
  pluginPath = path.join(__dirname, "../lib/package/plugins"),
  plugins = [];

fs.readdirSync(pluginPath).forEach(function(file) {
  plugins.push(file);
});

var FindFolder = require("node-find-folder"),
  path = require("path"),
  bl = require("../lib/package/bundleLinter.js"),
  rootDir = "/Users/davidwallen/Projects/";

process.chdir(rootDir);
var folders = new FindFolder("apiproxy");

folders.forEach(function(folder) {
  bl.lint({
    debug: true,
    source: {
      type: "filesystem",
      path: rootDir + folder
    },
    formatter: "unix.js",
    apiUpload: {
      destPath: "https://csdata-test.apigee.net/v1/lintresults",
      user: process.env.au,
      password: process.env.as,
      organization: "csdata"
    }
  });
});

Promise.all(folders)
.then(function() { 
  console.log('completed)'); 
})
.catch(console.error);