var name = "jsHint",
    description = "Variables that are created should be used as conditions, assigned to messages or accessed in a resource callout.",
    Resources = require("../Resource.js");

//look at conditions
//look at Steps and the associated Policies 
//look at Resources


var onResource = function (resource) {
    var jshint = require("jshint");
    if (!jshint.JSHINT(resource.getContents())) {
        var errors = jshint.JSHINT.errors;
        //now walk through each error
        errors.forEach(function (error) {
            if (error.code !== "W087") {
                resource.warn({
                    "name": "JSHint on file " + resource.getFileName() + " line " + error.line + " column " + error.character + " \"" + error.evidence + "\".",
                    "guidance": error.reason,
                });
            }
        });
    }
};

module.exports = {
    name,
    description,
    onResource
};
