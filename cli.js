#!/usr/bin/env node

/*
  Copyright 2019-2024 Google LLC

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

const program = require("commander"),
  fs = require("fs"),
  path = require("path"),
  tmp = require("tmp"),
  AdmZip = require("adm-zip"),
  bl = require("./lib/package/bundleLinter.js"),
  rc = require("./lib/package/apigeelintrc.js"),
  pkj = require("./package.json"),
  downloader = require("./lib/package/downloader.js"),
  bundleType = require("./lib/package/BundleTypes.js"),
  debug = require("debug");

/**
 * findBundle returns an array of three items:
 * 0: the validated source path, useful for resolving .apigeelintrc
 * 1: the actual directory, which may be a tmp dir if the source path is a zip
 * 2: either 'zip' or 'filesystem'
 **********************************************/
const findBundle = (p) => {
  // handle zipped bundles
  if (p.endsWith(".zip") && fs.existsSync(p) && fs.statSync(p).isFile()) {
    const tmpdir = tmp.dirSync({
      prefix: `apigeelint-${path.basename(p)}`,
      keep: false,
      unsafeCleanup: true, // this does not seem to work in apigeelint
    });
    // make sure to cleanup when the process exits
    process.on("exit", function () {
      tmpdir.removeCallback();
    });
    //console.log(`tmpdir: ` + JSON.stringify(tmpdir));
    const zip = new AdmZip(p);
    zip.extractAllTo(tmpdir.name, false);
    const found = findBundle(tmpdir.name);
    return [p, found[1], "zip"];
  }

  if (p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  const subdirnames = [
    bundleType.BundleType.SHAREDFLOW,
    bundleType.BundleType.APIPROXY,
  ];
  if (subdirnames.find((n) => p.endsWith(n)) && fs.statSync(p).isDirectory()) {
    return [p, p, "filesystem"];
  }
  const subdirs = subdirnames.map((d) => path.join(p, d));

  for (let i = 0; i < subdirs.length; i++) {
    if (fs.existsSync(subdirs[i]) && fs.statSync(subdirs[i]).isDirectory()) {
      if (
        !fs.existsSync(subdirs[1 - i]) ||
        !fs.statSync(subdirs[1 - i]).isDirectory()
      ) {
        return [subdirs[i], subdirs[i], "filesystem"];
      }
      throw new Error(
        "that path appears to contain both an apiproxy and a sharedflowbundle",
      );
    }
  }
  throw new Error(
    "that path does not appear to resolve to an apiproxy or sharedflowbundle",
  );
};

(async function main() {
  program
    .version(pkj.version)
    .option(
      "-s, --path <path>",
      "Path of the exploded apiproxy or sharedflowbundle directory",
    )
    .option(
      "-d, --download [value]",
      "Download the API proxy or sharedflow to analyze. Exclusive of -s / --path. Example: org:ORG,API:proxyname or org:ORG,sf:SHAREDFLOWNAME",
    )
    .option("-f, --formatter [value]", "Specify formatters (default: json.js)")
    .option("-w, --write [value]", "file path to write results")
    .option(
      "-e, --excluded [value]",
      "The comma separated list of tests to exclude (default: none)",
    )
    .option(
      "-x, --externalPluginsDirectory [value]",
      "Relative or full path to an external plugins directory",
    )
    .option(
      "-q, --quiet",
      "do not emit the report to stdout. (can use --write option to write to file)",
    )
    .option(
      "--list",
      "do not scan, instead list the available plugins and formatters",
    )
    .option(
      "--maxWarnings [value]",
      "Number of warnings to trigger nonzero exit code (default: -1)",
    )
    .option("--profile [value]", "Either apigee or apigeex (default: apigee)")
    .option(
      "--norc",
      "do not search for and use the .apigeelintrc file for settings",
    )
    .option(
      "--ignoreDirectives",
      "ignore any directives within XML files that disable warnings",
    );

  program.on("--help", function () {
    console.log("\nExamples:");
    console.log("   apigeelint -f table.js -s sampleProxy/apiproxy\n");
    console.log("   apigeelint -f table.js -s path/to/your/apiproxy.zip\n");
    console.log(
      "   apigeelint -f table.js --download org:my-org,api:my-proxy\n",
    );
    console.log("");
  });

  program.parse(process.argv);

  if (program.list) {
    console.log("available plugins: " + bl.listRuleIds().join(", ") + "\n");
    console.log("available formatters: " + bl.listFormatters().join(", "));
    if (fs.existsSync(program.externalPluginsDirectory)) {
      console.log(
        "\n" +
          "available external plugins: " +
          bl.listExternalRuleIds(program.externalPluginsDirectory).join(", ") +
          "\n",
      );
    }
    process.exit(0);
  }

  if (program.download) {
    if (program.path) {
      console.log(
        "you must specify either the -s /--path option, or the -d /--download option. Not both.",
      );
      process.exit(1);
    }
    // This will work only with Apigee X/hybrid
    program.path = await downloader.downloadBundle(program.download);
  }

  if (!program.path) {
    console.log(
      "you must specify the -s option, or the long form of that: --path ",
    );
    process.exit(1);
  }

  let [sourcePath, resolvedPath, sourceType] = findBundle(program.path);

  // apply RC file
  if (!program.norc) {
    const rcSettings = rc.readRc([".apigeelintrc"], sourcePath);
    if (rcSettings) {
      Object.keys(rcSettings)
        .filter((key) => key != "path" && key != "list" && !program[key])
        .forEach((key) => {
          debug("apigeelint:rc")(`applying [${key}] = ${rcSettings[key]}`);
          program[key] = rcSettings[key];
        });
    }
  }

  const configuration = {
    debug: true,
    source: {
      type: sourceType,
      path: resolvedPath,
      sourcePath: sourcePath,
      bundleType: resolvedPath.endsWith(bundleType.BundleType.SHAREDFLOW)
        ? bundleType.BundleType.SHAREDFLOW
        : bundleType.BundleType.APIPROXY,
    },
    externalPluginsDirectory: program.externalPluginsDirectory,
    excluded: {},
    maxWarnings: -1,
    profile: "apigee",
  };

  if (!isNaN(program.maxWarnings)) {
    configuration.maxWarnings = Number.parseInt(program.maxWarnings);
  }

  if (program.formatter) {
    configuration.formatter = program.formatter || "json.js";
  }

  if (program.quiet) {
    configuration.output = "none";
  }

  if (program.ignoreDirectives) {
    configuration.ignoreDirectives = true;
  }

  if (program.excluded && typeof program.excluded === "string") {
    configuration.excluded = program.excluded
      .split(",")
      .map((s) => s.trim())
      .reduce((acc, item) => ((acc[item] = true), acc), {});
  }

  if (program.write) {
    configuration.writePath = program.write;
  }

  if (program.profile) {
    configuration.profile = program.profile;
  }

  bl.lint(configuration);
})();
