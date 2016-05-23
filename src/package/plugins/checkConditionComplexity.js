//policyCount.js

//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

var name = "Check complexity of Step conditions.",
    description = "Overly complext conditions on Stesp are difficult to debug and maintain.";

var checkStep = function(step) {
    var lengthLimit = 64,
        condition = step.getCondition();

    if (condition && condition.length > lengthLimit) {
        step.warn({
            name: "Step condition \""+ condition+"\" size (" + condition.length + ") exceeds recommended length limit of " + lengthLimit + " characters. Review condition statement to see if it can be simplified.",
            guidance: "Large conditionals are more difficult to debug and maintain."
        });
    }
    //review the complexity of the condition itself - consider number of terms, nesting, etc
};

//var checkBundle = function(bundle) {};


module.exports = {
    name,
    description,
    checkStep
};
