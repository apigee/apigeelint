var plugin = {
    ruleId: "BUPrefix-001",
    name: "Check if the proxy name starts with SCTA-",
    message: "The proxy name should start with SCTA-",
    fatal: false,
    severity: 2, //error
    nodeType: "Bundle",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onBundle = function(bundle, cb) {
  var hadError = false;
  var proxyName = bundle.getName();

  if (!proxyName.startsWith("SCTA-")) {
    bundle.addMessage({
      plugin,
      message: "API Proxy name (" + proxyName + ") should start with SCTA-*"
    });
    hadError = true;
  }

  if (typeof(cb) == 'function') {
    cb(null, hadError);
  }

  return hadError;
};

module.exports = {
  plugin,
  onBundle
};
