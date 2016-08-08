var name = "Unreachable Route Rules - defaults",
    description = "Check RouteRules in a ProxyEndpoint to ensure that one and only one has a blank set of conditions.",
    myUtil = require("../myUtil.js");

var onProxyEndpoint = function(ep) {

    var warnMessage = "More than 1 empty condition was found in the RouteRules for \"" + ep.getFileName() + "\". Lines: ",
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
            ep.warn({
                name: warnMessage,
                guidance: "Evaluation of RouteRules proceeds from top to bottom, the first match is executed. The additional RouteRules are therefore unreachable."
            });
        }
    }
};

module.exports = {
    name,
    description,
    onProxyEndpoint
};
