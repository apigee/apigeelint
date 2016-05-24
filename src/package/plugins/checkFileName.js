//checkFileName.js

var name = "Check File and Display Naming",
    description = "Check that file names correspond to policy display names.";

var checkPolicy = function(policy) {
    var fname = policy.getFileName().split(".xml")[0];

    if (fname !== policy.getDisplayName()) {
        policy.warn({
            name: "Filename \"" + policy.getFileName() + "\" does not match policy display name \"" + policy.getDisplayName() + "\"",
            guidance: "To avoid confusion when working online and offline use the same name for files and display name in policies (excluding .xml extension)."
        });
    }
};

module.exports = {
    name,
    description,
    checkPolicy
};
