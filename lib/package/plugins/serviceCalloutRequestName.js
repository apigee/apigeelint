var name = "Check ServiceCallout for Request variable name.",
    description = "Using request for the Request name causes unexepcted side effects.",
    myUtil = require("../myUtil.js");

var onPolicy = function(policy) {
    if (policy.getType() === "ServiceCallout" && myUtil.selectAttributeValue(policy, "/ServiceCallout/Request/@variable") === "request") {
        policy.warn({
            name: "Policy \"" + policy.getFileName() + "\" has a Request variable named \"request\", this may lead to unexpected side effects",
            guidance: "Rename the Request variable."
        });
    }
};

module.exports = {
    name,
    description,
    onPolicy
};
