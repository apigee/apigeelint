//policyCount.js

//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

var name = "Check number of policies present in the bundle",
    description = "Large bundles can be problematic in development and difficult to maintain.";

var onBundle = function(bundle) {
    var limit = 4; //for testing set to 200 on release

    if (bundle.policies && bundle.policies.length > limit) {
        bundle.warn({
            name: "Bundle size (" + bundle.policies.length + ") exceeds recommended limit of " + limit + ". Consider refactoring into two or more bundles.",
            guidance: "Large bundle take longer to deploy and are more difficult to debug and maintain."
        });
    }
};

//var checkBundle = function(bundle) {};


module.exports = {
    name,
    description,
    onBundle
};
