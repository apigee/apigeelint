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

//checkFaultRuleCondition
//FR001 | No Condition on FaultRule | It's not a best practice to have a FaultRule without an

const plugin = {
  ruleId : require("../myUtil.js").getRuleId(),
  name: "No Condition on FaultRule",
  message:
    "A FaultRule without a condition statement will behave like a DefaultFaultRule. Consider either adding a Condition or migrating to DefaultFaultRule.",
  fatal: false,
  severity: 2, //error
  nodeType: "FaultRule",
  enabled: true
};

const onFaultRule = function(faultRule, cb) {
        var hadErr = false;
        if (
          !faultRule.getCondition() ||
            (faultRule.getCondition() &&
             faultRule.getCondition().getExpression() === "")
        ) {
          let name = faultRule.getName();
          faultRule.addMessage({
            plugin,
            line: faultRule.getElement().lineNumber,
            column: faultRule.getElement().columnNumber,
            message: `FaultRule (${name}) has no Condition or the Condition is empty.`
          });
          hadErr = true;
        }
        if (typeof(cb) == 'function') {
          cb(null, hadErr);
        }
      };

module.exports = {
  plugin,
  onFaultRule
};
