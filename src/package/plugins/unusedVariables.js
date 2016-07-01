var name="Unused variables",
	description="Look for variables that were defined but not referenced";

// This plugin does **NOT** check for variables that are used incorrectly.
// TODO: FaultRules

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

function checkBundle(bundle) {

}

module.exports {
	name,
	description,
	checkBundle
};