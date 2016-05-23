//checkUnattachedPolicies.js

var name = "Check for unattached policies.",
    description = "Unattached policies are dead code. They should be removed from bundles before releasing the bundle to produciton.";

var checkStep = function(step) {
    //this forces the policies to get loaded on steps if they have not already
};

var checkPolicy = function(policy) {
    if (!policy.getSteps() || policy.getSteps().length === 0) {
        policy.warn({
            name: "Policy \"" + policy.getFileName() + "\" is not attached to a Step in the bundle.",
            guidance: "Remove unused policies."
        });
    }
};


module.exports = {
    name,
    description,
    checkStep,
    checkPolicy
};
