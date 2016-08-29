//unconditionalFlows.js

var name="Unconditional Flows",
	description="Only one unconditional flow will be executed.  Error if more than one detected";

var searchUnconditionalFlowsInEndpoint = function ( endpoint) {
	var unconditionalFlows = 0;
	endpoint.getFlows() && endpoint.getFlows().forEach(function(fl) { 
		if( ! fl.getCondition() || fl.getCondition().getExpression() === "") {
			unconditionalFlows++;
		}
	});
	if( unconditionalFlows > 0) {
		endpoint.err("Endpoint " + endpoint.getProxyName() + " has too many uncondtional flows (" + unconditionalFlows + ").  Only one will be executed.");
	}
};

// TODO: expand to include RouteRules conditions when that is implemented

var onProxyEndpoint = function (endpoint) {
	return searchUnconditionalFlowsInEndpoint(endpoint);
};

var onTargetEndpoint = function (endpoint) {
	return searchUnconditionalFlowsInEndpoint(endpoint);
};

module.exports = {
	name,
	description,
	onProxyEndpoint,
	onTargetEndpoint
};