//checkFileName.js

var name = "Check File and Policy Naming",
    description = "Check that file names correspond to policy names.";

var checkPolicy = function(policy) {
    var fname = policy.getFileName().split(".xml")[0];

    if (fname !== policy.getName()) {
        policy.warn({
            name: "Filename \"" + policy.getFileName() + "\" does not match policy name \"" + policy.getName() + "\"",
            guidance: "To avoid confusion when working online and offline use the same name for files and policies (excluding .xml extension)."
        });
    }
};

module.exports = {
    name,
    description,
    checkPolicy
};
