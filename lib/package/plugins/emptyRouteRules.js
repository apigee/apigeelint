var plugin = {
    ruleId: "PD002",
    name: "Unreachable Route Rules - Defaults",
    message:
      "Check RouteRules in a ProxyEndpoint to ensure that one and only one has a blank set of conditions.",
    fatal: false,
    severity: 2, //error
    nodeType: "RouteRule"
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onProxyEndpoint = function(ep) {
  var warnMessage =
      'More than 1 empty condition was found in the RouteRules for "' +
      ep.getFileName() +
      '". Lines: ',
    routeRules = ep.getRouteRules(),
    blankRR = [];

  if (routeRules) {
    routeRules.forEach(function(rr) {
      var c = rr.getCondition();

      if (!c || c.getExpression === "") {
        blankRR.push(rr);
        warnMessage += rr.getElement().lineNumber + " ";
      }
    });

    if (blankRR.length > 1) {
      var result = {
        ruleId: plugin.ruleId,
        severity: plugin.severity,
        source: blankRR[0].getSource(),
        line: blankRR[0].getElement().lineNumber,
        column: blankRR[0].getElement().columnNumber,
        nodeType: plugin.nodeType,
        message:
          "Evaluation of RouteRules proceeds from top to bottom, the first match is executed. The additional RouteRules are therefore unreachable." +
          warnMessage
      };
      ep.addMessage(result);
    }
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};
