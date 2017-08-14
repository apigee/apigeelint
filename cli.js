#!/usr/bin/env node
var bl = require("./lib/package/bundleLinter.js");
var program = require("commander");

program
  .version("0.1.8")
  .option("-s, --path <path>", "Path of the proxies")
  .option("-f, --formatter [value]", "Specify formatters (default json.js)")
  .option("-w, --write [value]", "file path to write results")
  .option(
    "-d, --destPath [value]",
    "Provide the host and path to upload linter results"
  )
  .option("-u, --user [value]", "Apigee user account")
  .option("-p, --password [value]", "Apigee password")
  .option("-o, --organization [value]", "Apigee organization");

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
  configuration.formatter = program.formatter || "json.js";
}

if (program.user) {
  //check for required fields
  configuration.apiUpload = {
    destPath:
      program.destPath || "https://csdata-test.apigee.net/v1/lintresults",
    user: program.user,
    password: program.password,
    organization: program.organization
  };
}

if (program.write) {
  configuration.writePath = program.write;
}

bl.lint(configuration);
