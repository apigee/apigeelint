var plugin = {
    ruleId: "PD003",
    name: "Unreachable Route Rules - empty conditions go last",
    message:
      "Check RouteRules in a ProxyEndpoint to ensure that empty condition is last.",
    fatal: false,
    severity: 2, //error
    nodeType: "RouteRule",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onProxyEndpoint = function(ep, cb) {
  var routeRules = ep.getRouteRules() || [],
    hadError = false;
  for (var i = routeRules.length - 2; i >= 0; i--) {
    var c = routeRules[i].getCondition() || "";
    if (c.getExpression === "") {
      ep.addMessage({
        plugin,
        message:
          "RouteRule at line " +
          routeRules[i].getElement().lineNumber +
          " has an empty condition and is not the last RouteRule defined. Evaluation of RouteRules proceeds from top to bottom, the first match is executed. Additional RouteRules are therefore unreachable."
      });
      hadError = true;
    }
  }
  if (typeof(cb) == 'function') {
    cb(hadError);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};
