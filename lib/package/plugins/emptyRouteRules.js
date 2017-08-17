var plugin = {
    ruleId: "PD002",
    name: "Unreachable Route Rules - Defaults",
    message:
      "Check RouteRules in a ProxyEndpoint to ensure that one and only one has a blank set of conditions.",
    fatal: false,
    severity: 2, //error
    nodeType: "RouteRule",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onProxyEndpoint = function(ep, cb) {
  var warnMessage =
      "More than 1 empty condition was found in the RouteRules. Lines: ",
    routeRules = ep.getRouteRules(),
    blankRR = [],
    hadError = false;

  if (routeRules) {
    routeRules.forEach(function(rr) {
      var c = rr.getCondition();
      if (!c || c.getExpression === "") {
        blankRR.push(rr);
        warnMessage += rr.getElement().lineNumber + " ";
      }
    });
    if (blankRR.length > 1) {
      ep.addMessage({
        plugin,
        message:
          "Evaluation of RouteRules proceeds from top to bottom, the first match is executed. " +
          warnMessage +
          "."
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
