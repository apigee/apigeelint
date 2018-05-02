//extractXMLConditionCheck
//| &nbsp; |:white_check_mark:| PO004 | Extract Variables with XMLPayload |  A check for a body element must be performed before policy execution. |

var plugin = {
    ruleId: "PO004",
    name: "Extract Variables with XMLPayload",
    message:
      "A check for a body element must be performed before policy execution.",
    fatal: false,
    severity: 2, //error
    nodeType: "ExtractVariables",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  xpath = require("xpath");

var onPolicy = function(policy,cb) {
  var condRegExp =
    "(response.content|response.form|request.content|request.form|message.content|message.form|message.verb|request.verb)";

  var hadWarning = false;
  if (policy.getType() === "ExtractVariables") {
    var xmlPayload = xpath.select(
      "/ExtractVariables/XMLPayload/text()",
      policy.getElement()
    );

    var sourceElement = xpath.select(
        "/ExtractVariables/Source/text()",
        policy.getElement()
    );

    if (sourceElement.length) {
      source = sourceElement[0].data;

      condRegExp = !source.match(condRegExp) ? source : condRegExp;
    }


    if (xmlPayload.length > 0 && policy.getSteps().length > 0) {
      var missingBodyCheck = false,
        steps = policy.getSteps();
      //get steps
      //check each step for a condition on body
      steps.forEach(function(step) {
        var condition = step.getCondition();
        if (!condition || !condition.getExpression().match(condRegExp)) {
          missingBodyCheck = true;

          //is the parent a flow we might revert the decision if it has an appropriate condition
          if (step.parent && step.parent.getType() === "Flow") {
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
    if (typeof(cb) == 'function') {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
