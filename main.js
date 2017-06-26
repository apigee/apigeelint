#!/usr/bin/env node
var bl = require("./lib/package/bundleLinter.js"),
util = require("util");
var program = require('commander');

program
  .version('0.0.1')
  .option('-s --path <path>','Path of the proxies')
  .parse(process.argv);

console.log('path', program.path);


var configuration = {
    debug: true,
    "source": {
        "type": "filesystem",
        "path": program.path,
    },
    //plugins: ['bundleStructure.js']
};


//console.log(util.inspect(bl.lint(configuration), { showHidden: true, depth: 50, maxArrayLength: 100 }));
bl.lint(configuration);
