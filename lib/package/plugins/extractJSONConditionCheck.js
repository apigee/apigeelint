/*
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

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
  xpath = require("xpath");

var onPolicy = function(policy, cb) {
  var condRegExp =
    "(response.content|response.form|request.content|request.form|message.content|message.form|message.verb|request.verb)";

  var hadWarning = false;
  if (policy.getType() === "ExtractVariables") {
    var jsonPayload = xpath.select(
      "/ExtractVariables/JSONPayload/text()",
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

    if (jsonPayload.length > 0 && policy.getSteps().length > 0) {
      var missingBodyCheck = false,
        steps = policy.getSteps();
      //get steps
      //check each step for a condition on body
      steps.forEach(function(step) {
        var condition = step.getCondition();
        if (!condition || !condition.getExpression().match(condRegExp)) {
          missingBodyCheck = true;

          var parent = step.parent;
          //is the parent a flow we might revert the decision if it has an appropriate condition
          if (parent && parent.getType() === "FlowPhase") {
            parent = parent.parent;
          }
          if (parent && parent.getType() === "Flow") {
            //&& step.parent.getCondition
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
