//extractJSONConditionCheck
//| &nbsp; |:white_medium_square:| PO003 | Extract Variables with JSONPayload |  A check for a body element must be performed before policy execution. |

var plugin = {
    ruleId: "PO003",
    name: "Extract Variables with JSONPayload",
    message:
      "A check for a body element must be performed before policy execution.",
    fatal: false,
    severity: 2, //error
    nodeType: "ExtractVariables",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  xpath = require("xpath"),
  condRegExp =
    "(response.content|response.form|request.content|request.form|message.content|message.form|message.verb|request.verb)";

var onPolicy = function(policy) {
  var hadWarning = false;
  if (policy.getType() === "ExtractVariables") {
    var jsonPayload = xpath.select(
      "/ExtractVariables/JSONPayload/text()",
      policy.getElement()
    );

    if (jsonPayload.length > 0 && policy.getSteps().length > 0) {
      var missingBodyCheck = false,
        steps = policy.getSteps();
      //get steps
      //check each step for a condition on body
      steps.forEach(function(step) {
        var condition = step.getCondition();
        if (!condition || !condition.getExpression().match(condRegExp)) {
          missingBodyCheck = true;

          var parent=step.parent;
          //is the parent a flow we might revert the decision if it has an appropriate condition
          if(parent.getType()==="FlowPhase"){
            parent=parent.parent;
          }
          if (parent && parent.getType() === "Flow" ) {//&& step.parent.getCondition
            var condition = step.parent.getCondition();
            if (condition && condition.getExpression().match(condRegExp)) {
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
