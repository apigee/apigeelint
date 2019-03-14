//module that will take a function
//and run that function for every bundle in allBundles.json

var async = require("async"),
  Bundle = require("../../lib/package/Bundle.js"),
  fs = require("fs"),
  allBundles,
  iterate = function(f) {
    async.everySeries(
      allBundles,
      function(folder,cb) {
        var config = {
          debug: true,
          source: {
            type: "filesystem",
            path: folder
          },
          formatter: "table.js"
        };
        var bundle = new Bundle(config);
        f(bundle, cb);
      },
      function(err, result) {
        console.log(result);
      }
    );
  };

module.exports = function(f) {
  if (!allBundles) {
    var result = fs.readFileSync("./test/fixtures/allBundles.json");
    allBundles = JSON.parse(result);
    iterate(f);
  } else {
    iterate(f);
  }
};
