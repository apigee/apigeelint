var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  debug = require("debug")("bundlelinter"),
  Bundle = require("../lib/package/Bundle.js"),
  util=require("util");

describe("Basic checks for bundle", function() {
  var configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: "./test/sampleProxy/24Solver/apiproxy"
    }
  };
  debug("test configuration: " + JSON.stringify(configuration));

  var bl = require("../lib/package/bundleLinter.js");
  var bundle = new Bundle(configuration);
  //bundles have targetEndpoints and proxyEndpoints
  var proxyEPs = bundle.getProxyEndpoints();
  debug("bundle.getProxyEndpoints().length = " + proxyEPs.length);
  proxyEPs.forEach(function(pep) {
    debug("pep.getDefaultFaultRule()" + pep.getDefaultFaultRule());
  });
  var targetEPs = bundle.getTargetEndpoints();
  targetEPs.forEach(function(tep) {
    debug("tep.getDefaultFaultRule(): \n" + util.inspect(tep.getDefaultFaultRule().summarize(), { showhidden:false, depth: 3, maxArrayLength: 10 }));
  });
});

