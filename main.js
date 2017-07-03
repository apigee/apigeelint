#!/usr/bin/env node
var bl = require("./lib/package/bundleLinter.js"),
  util = require("util");
var program = require("commander");

program
  .version("0.1.6")
  .option("-s, --path <path>", "Path of the proxies")
  .option("-f, --formatter <json.js>", "Specify formatters (default json.js)");

program.on("--help", function() {
  console.log("example");
  console.log("");
  console.log("apigeelint -s No-Target");
  console.log("");
});

program.parse(process.argv);

var configuration = {
  debug: true,
  source: {
    type: "filesystem",
    path: program.path
  }
};

if (program.formatter) {
  configuration.formatter = program.formatter;
}

bl.lint(configuration);