//stepTest.js

var name = "Empty Steps",
    description = "Empty steps clutter a bundle.";

var checkStep = function(step) {

    if (step.getName() === "") {
        step.warn({
            name: "Step at " + step.getFlowName() + "("+step.getElement().lineNumber+":"+ step.getElement().columnNumber+")"+" is empty.",
            guidance: "Empty steps clutter a bundle."
        });
    }
};

module.exports = {
    name,
    description,
    checkStep
};
