var name="Unused variables",
	description="Look for variables that were defined but not referenced";

// This plugin does **NOT** check for variables that are used incorrectly.
// TODO: FaultRules

// basic regex for finding variables
// TODO: handle objects -- right now just verify the highest level variable.
var varFinder = /{([^}\.]+?)(\.[^}]+?)??}/g;

// preload the symbol table with framework globals
var globalSymtab = [
	"proxy",
	"request",
	"response"
];

// errors that will be reported at the end of the process
var errors = [];

// warnings that will be reported at the end of the process
var warnings = [];

// Process proxyendpoints in the following order:
// 1. preflow - request [steps]
// 2. flow - request [steps]
// 3. postflow - request [steps]
// 4. routerules
//    - targetendpoint
//       . pre/flow/post
//       . pre - response
//       . flow - response
//       . post - response
// TODO: inspect things referenced by steps to populate symbol table and check for bad var references.
var onBundle = function (bundle) {
	bundle.getProxyEndpoints().forEach(function(endpoint){
		var localSymtab = [];
		evaluateSteps(endpoint.getPreFlow().getFlowRequest().getSteps(), localSymtab);
		endpoint.getFlows().forEach(function(flow) {
			evaluateSteps(flow.getFlowRequest().getSteps(), localSymtab);
		});
		evaluateSteps(endpoint.getPostFlow().getFlowRequest().getSteps(), localSymtab);

		var intermediateSymtab = localSymtab.slice(0); // don't update orig array references!
		// iterate through routerules now ...
		bundle.getTargetEndpoints().forEach(function(target){
			localSymtab = intermediateSymtab.slice(0); // reset the local symbol table

			// evaluate the target's inbound request flow(s)
			evaluateSteps(target.getPreFlow().getFlowRequest().getSteps(), localSymtab)
			target.getFlows().forEach(function(flow){
				evaluateSteps(flow.getFlowRequest().getSteps(), localSymtab);
			});
			evaluateSteps(target.getPostFlow().getFlowRequest().getSteps(), localSymtab);

			// assume the target was called, evalute the response flow(s)
			evaluateSteps(target.getPreFlow().getFlowResponse().getSteps(), localSymtab)
			target.getFlows().forEach(function(flow){
				evaluateSteps(flow.getFlowResponse().getSteps(), localSymtab);
			});
			evaluateSteps(target.getPostFlow().getFlowResponse().getSteps(), localSymtab);

			// finally, evalute the response flow(s) for the endpoint with this set of
			// 	local symbols...
			evaluateSteps(endpoint.getPreFlow().getFlowResponse().getSteps(), localSymtab)
			endpoint.getFlows().forEach(function(flow){
				evaluateSteps(flow.getFlowResponse().getSteps(), localSymtab);
			});
			evaluateSteps(endpoint.getPostFlow().getFlowResponse().getSteps(), localSymtab);			
		});
	});
}

// TODO: evalute where symbols are added, and record them in our symbol table.
var evaluateSteps = function(steps, localSymtab) {
	steps.forEach( function(step) {
		if( step.getName()) {
			var badVars = getUndefinedVariables(step.getName(), localSymtab);
			badVars.forEach(function(badvar){
				step.err("Variable {" + badvar + "} was used in step name, but not previously defined");
			});
		} else {
			step.warn("Step does not seem to call anything (empty <Name> node)");
		}
		if( step.getCondition()) {
			var badVars = getUndefinedVariables(step.getCondition().getExpression());
			badVars.forEach(function(badvar){
				step.err("Variable {" + badvar + "} was used in step condition, but not previously defined");
			});
		}
	});
}

// return a list of variables referenced in this string 
// that are undefined (may be empty)
var getUndefinedVariables = function (value, localSymtab) {
	var symtab = globalSymtab.concat(localSymtab);
	var undefinedVars = [];
	while((match = varFinder.exec(value)) != null) {
		var variable = match[1];
		if( ! (variable in symtab)) {
			undefinedVars.push(variable)
		}
	}
	return undefinedVars;
}

module.exports = {
	name,
	description,
	onBundle
};