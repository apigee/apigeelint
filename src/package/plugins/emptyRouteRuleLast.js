var name = "Unreachable Route Rules - empty last",
    description = "Check RouteRules in a ProxyEndpoint to ensure that empty condition is last.",
    myUtil = require("../myUtil.js");

var onProxyEndpoint = function(ep) {
    var routeRules = ep.getRouteRules();
    if (routeRules) {
        for (var i = routeRules.length - 2; i >= 0; i--) {
            var c = routeRules[i].getCondition();

            if (!c || c.getExpression === "") {
                ep.warn({
                    name: "RouteRule at line " + routeRules[i].getElement().lineNumber + " has an empty condition and is not the last RouteRule defined.",
                    guidance: "Evaluation of RouteRules proceeds from top to bottom, the first match is executed. Additional RouteRules are therefore unreachable."
                });
            }
        }
    }
};

module.exports = {
    name,
    description,
    onProxyEndpoint
};
