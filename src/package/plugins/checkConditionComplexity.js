//policyCount.js

//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

var myUtil = require("../myUtil.js"),
    name = "Check length of condition.",
    description = "Overly long conditions on Stesp are difficult to debug and maintain.";

var checkCondition = function(condition) {
    var lengthLimit = 64,
        expression = condition.getExpression();

    if (expression && expression.length > lengthLimit) {
        condition.warn({
            name: "Condition at " + myUtil.getFileName(condition) + "(" + condition.getElement().lineNumber + ":" + condition.getElement().columnNumber + ")" + " \"" + condition.getExpression() + "\" size (" + condition.getExpression().length + ") exceeds recommended length limit of " + lengthLimit + " characters. Review condition statement to see if it can be simplified.",
            guidance: "Large conditionals are more difficult to debug and maintain."
        });
    }
};

module.exports = {
    name,
    description,
    checkCondition
};
