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

//threatProtectionXMLConditionCheck
//| &nbsp; |:white_medium_square:| PO002 | XML Threat Protection |  A check for a body element must be performed before policy execution. |

var plugin = {
    ruleId: "PO002",
    name: "XMLThreatProtection check for body",
    message:
      "A check for a body element must be performed before policy execution.",
    fatal: false,
    severity: 2, //error
    nodeType: "XMLThreatProtection",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  condRegExp =
    "(response.content|response.form|request.content|request.form|message.content|message.form|message.verb|request.verb)";

var onPolicy = function(policy, cb) {
  var hadWarning = false;
  if (policy.getType() === "XMLThreatProtection") {
    if (policy.getSteps().length > 0) {
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
