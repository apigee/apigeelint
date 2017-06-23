//checkUnattachedPolicies.js

var name = "Check for unattached policies.",
    description = "Unattached policies are dead code. They should be removed from bundles before releasing the bundle to produciton.",
    policies = {};

var onStep = function(step) {
    //the name tag on a step contains the policy name
    var policyName = step.getName();
    if (!policies[policyName]) { policies[policyName] = []; }
    policies[policyName].push(step);
};

var onPolicy = function(policy) {
    if (!policies[policy.getName()]) {
        policy.warn({
            name: "Policy \"" + policy.getFileName() + "\" is not attached to a Step in the bundle.",
            guidance: "Remove unused policies."
        });
    }
};


module.exports = {
    name,
    description,
    onStep,
    onPolicy
};
