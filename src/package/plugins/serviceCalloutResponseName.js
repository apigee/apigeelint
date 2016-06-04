var name = "Check ServiceCallout for response variable name.",
    description = "Using response for the Response name causes unexepcted side effects.",
    myUtil = require("../myUtil.js");

var onPolicy = function(policy) {
    if (policy.getType() === "ServiceCallout" && myUtil.selectTagValue(policy, "/ServiceCallout/Response") === "response") {
        policy.warn({
            name: "Policy \"" + policy.getFileName() + "\" has a Response variable named \"response\", this may lead to unexpected side effects",
            guidance: "Rename the Response variable."
        });
    }
};

module.exports = {
    name,
    description,
    onPolicy
};
