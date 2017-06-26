//checkConditionTruth.js

var name = "Check truth table of a condition.",
    description = "Conditions that can never be true should be avoided.";

var onCondition = function (condition) {
    var truthTable = condition.getTruthTable();
    //truthTable will be null if no condition was present
    if (truthTable && truthTable.evaluation !== "valid") {
        condition.warn({
            name: "Condition " + " \"" + condition.getExpression() + "\" has a truth table issue.",
            guidance: "Review conditional, simplify if possible. Steps, Flow, Routerules, etc with a conditional that can never evaluate to True are considered dead code."
        });
    }
};



module.exports = {
    name,
    description,
    onCondition
};
