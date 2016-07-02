var name="Unused variables",
	description="Look for variables that were defined but not referenced";

// This plugin does **NOT** check for variables that are used incorrectly.
// TODO: FaultRules

// basic regex for finding variables
// TODO: handle objects -- right now just verify the highest level variable.
var varFinder = /{([^}\.]+?)(\.[^}]+?)??}/g;

// preload the symbol table with framework globals
var symtab = {
	"proxy":[ "Edge Global" ],
	"request": [ "Edge Global" ],
	"response": [ "Edge Global" ]
};

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
		endpoint.getPreFlow().getFlowRequest().getSteps().forEach( function(step) {
			if( step.getName()) {
				var badVars = getUndefinedVariables(step.getName());
				badVars.forEach(function(badvar){
					step.err("Variable {" + badvar + "} was used in step name, but not previously defined");
				});
			} else {
				step.warn("Step in preFlow does not seem to call anything (empty <Name> node)");
			}
			if( step.getCondition()) {
				var badVars = getUndefinedVariables(step.getCondition().getExpression());
				badVars.forEach(function(badvar){
					step.err("Variable {" + badvar + "} was used in step condition, but not previously defined");
				});
			}
		});
	});
}

// return a list of variables referenced in this string 
// that are undefined (may be empty)
var getUndefinedVariables = function (value) {
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