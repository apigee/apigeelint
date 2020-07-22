var plugin = {
    ruleId: "BP001",
    name: "Check if the proxy basepath starts with a specific prefix",
    message: "The proxy basepath should start with /ta-",
    fatal: false,
    severity: 2, //error
    nodeType: "Bundle",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onProxyEndpoint = function(ep, cb) {
  var httpProxyConnection = ep.getHTTPProxyConnection(),
    blankRR = [],
    hadError = false;
   

  if (httpProxyConnection) {
    var basePath = httpProxyConnection.getBasePath();
    var apiVersion = "/v1/";
   /*
    if(basePath.toLocaleLowerCase().indexOf(apiVersion.toLocaleLowerCase()) > -1)
    {
      basePath = basepath.substring(4);
    }
    */
    if(!basePath.startsWith("/ta-"))
    {
        ep.addMessage({
        plugin,
        message: plugin.message
      });
      hadError = true;
 
    }
  }
  if (typeof(cb) == 'function') {
    cb(null, hadError);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};
