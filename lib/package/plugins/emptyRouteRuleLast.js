var plugin = {
    ruleId: "PD003",
    name: "Unreachable Route Rules - empty conditions go last",
    message:
      "Check RouteRules in a ProxyEndpoint to ensure that empty condition is last.",
    fatal: false,
    severity: 2, //error
    nodeType: "RouteRule"
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onProxyEndpoint = function(ep) {
  var routeRules = ep.getRouteRules() || [];
  for (var i = routeRules.length - 2; i >= 0; i--) {
    var c = routeRules[i].getCondition() || "";

    if (c.getExpression === "") {
      var result = {
        ruleId: plugin.ruleId,
        severity: plugin.severity,
        source: routeRules[i].getSource(),
        line: routeRules[i].getElement().lineNumber,
        column: routeRules[i].getElement().columnNumber,
        nodeType: plugin.nodeType,
        message:
          "RouteRule at line " +
          routeRules[i].getElement().lineNumber +
          " has an empty condition and is not the last RouteRule defined. Evaluation of RouteRules proceeds from top to bottom, the first match is executed. Additional RouteRules are therefore unreachable."
      };
      ep.addMessage(result);
    }
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};
