//extractFormParamConditionCheck
//| &nbsp; |:white_medium_square:| PO005 | Extract Variables with FormParam |  A check for a body element must be performed before policy execution. |

var plugin = {
    ruleId: "PO005",
    name: "Extract Variables with FormParam",
    message:
      "A check for a body element must be performed before policy execution.",
    fatal: false,
    severity: 2, //error
    nodeType: "ExtractVariables",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  myUtil = require("../myUtil.js"),
  xpath = require("xpath");

var onPolicy = function(policy) {
  var hadWarning = false;
  if (policy.getType() === "ExtractVariables") {
    var formParam = xpath.select(
      "/ExtractVariables/FormParam/text()",
      policy.getElement()
    );

    if (formParam.length > 0 && policy.getSteps().length > 0) {
      var missingBodyCheck = false,
        steps = policy.getSteps();
      //get steps
      //check each step for a condition on body
      steps.forEach(function(step) {
        var condition = step.getCondition();
        if (
          !condition ||
          !condition
            .getExpression()
            .match(
              "(request.content|request.form|message.content|message.form|message.verb|request.verb)"
            )
        ) {
          missingBodyCheck = true;

          //is the parent a flow we might revert the decision if it has an appropriate condition
          if (step.parent && step.parent.getType() === "Flow") {
            var condition = step.parent.getCondition();
            if (
              condition &&
              condition
                .getExpression()
                .match(
                  "(request.content|request.form|message.content|message.form|message.verb|request.verb)"
                )
            ) {
              missingBodyCheck = false;
            }
          }
        }
      });

      if (missingBodyCheck) {
        hadWarning = true;
        policy.addMessage({
          plugin,
          message:
            "An appropriate check for a message body was not found on the enclosing Step or Flow."
        });
      }
    }
  }
  return hadWarning;
};

module.exports = {
  plugin,
  onPolicy
};
