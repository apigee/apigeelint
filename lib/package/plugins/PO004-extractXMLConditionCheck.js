/*
  Copyright 2019-2020 Google LLC

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

//extractXMLConditionCheck
//| &nbsp; |:white_check_mark:| PO004 | Extract Variables with XMLPayload |  A check for a body element must be performed before policy execution. |

const xpath = require("xpath"),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Extract Variables with XMLPayload",
        message:
        "A check for a body element must be performed before policy execution.",
        fatal: false,
        severity: 2, //error
        nodeType: "ExtractVariables",
        enabled: true
      };

const onPolicy = function(policy,cb) {
        let condRegExp =
    "(response.content|response.form|request.content|request.form|message.content|message.form|message.verb|request.verb)";
        let hadWarning = false;
        if (policy.getType() === "ExtractVariables") {
          let xmlPayload = xpath.select(
                "/ExtractVariables/XMLPayload/text()",
                policy.getElement()
              );

          let sourceElement = xpath.select(
                "/ExtractVariables/Source/text()",
                policy.getElement()
              );

          if (sourceElement.length) {
            let source = sourceElement[0].data;
            condRegExp = !source.match(condRegExp) ? source : condRegExp;
          }


          if (xmlPayload.length > 0 && policy.getSteps().length > 0) {
            let hasBodyChecks =
              policy.getSteps().every( step => {
                let condition = step.getCondition();
                if (condition && condition.getExpression().match(condRegExp)) {
                  return true;
                }
                // is the parent a flow? And does it check?
                if (step.parent && step.parent.getType() === "Flow") {
                  condition = step.parent.getCondition();
                  if (condition && condition.getExpression().match(condRegExp)) {
                    return true;
                  }
                }
                return false;
              });

            if ( ! hasBodyChecks) {
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
