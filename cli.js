#!/usr/bin/env node

/*
  Copyright 2019-2020 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const program    = require("commander"),
      bl         = require("./lib/package/bundleLinter.js"),
      pkj        = require('./package.json'),
      bundleType = require('./lib/package/BundleTypes.js');

program
  .version(pkj.version)
  .option("-s, --path <path>", "Path of the proxies")
  .option("-f, --formatter [value]", "Specify formatters (default json.js)")
  .option("-w, --write [value]", "file path to write results")
  .option("-e, --excluded [value]", "The comma separated list of tests to exclude (default: none)")
  // .option("-M, --mgmtserver [value]", "Apigee management server")
  // .option("-u, --user [value]", "Apigee user account")
  // .option("-p, --password [value]", "Apigee password")
  // .option("-o, --organization [value]", "Apigee organization")
  .option("-x, --externalPluginsDirectory [value]", "Relative or full path to an external plugins directory")
  .option("--list", "do not execute, instead list the available plugins and formatters")
  .option("--maxWarnings [value]", "Number of warnings to trigger nonzero exit code - (default: -1)");

program.on("--help", function() {
  console.log("\nExample: apigeelint -s sampleProxy/ -f table.js");
  console.log("");
});

program.parse(process.argv);

if (program.list) {
  console.log('available plugins: ' + bl.listRuleIds().join(', ') + '\n');
  console.log('available formatters: ' + bl.listFormatters().join(', '));
  process.exit(0);
}

var configuration = {
  debug: true,
  source: {
    type: "filesystem",
    path: program.path,
    bundleType: program.path.includes(bundleType.BundleType.SHAREDFLOW) ? bundleType.BundleType.SHAREDFLOW : bundleType.BundleType.APIPROXY
  },
  externalPluginsDirectory: program.externalPluginsDirectory,
  excluded: {},
  maxWarnings: -1
};

if(!isNaN(program.maxWarnings)){
  configuration.maxWarnings = Number.parseInt(program.maxWarnings);
}

if (program.formatter) {
  configuration.formatter = program.formatter || "json.js";
}

if (program.excluded && typeof(program.excluded) === "string") {
  configuration.excluded = program
    .excluded
    .split(',')
    .map(s => s.trim())
    .reduce( (acc, item) => (acc[item] = true, acc), {});
}

if (program.write) {
  configuration.writePath = program.write;
}

bl.lint(configuration);
