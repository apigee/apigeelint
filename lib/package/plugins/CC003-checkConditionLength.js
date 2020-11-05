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

//checkConditionLength.js

const plugin = {
        ruleId : require("../myUtil.js").getRuleId(),
        name: "Condition Length",
        message:
        "Overly long conditions on Steps are difficult to debug and maintain.",
        fatal: false,
        severity: 1, //warning
        nodeType: "Condition",
        enabled: true
      };

const onCondition = function(condition, cb) {
  let lengthLimit = 256,
      expression = condition.getExpression(),
      hadWarn = false;

  if (expression && expression.length > lengthLimit) {
    condition.addMessage({
      source: condition.getExpression(),
      line: condition.getElement().lineNumber,
      column: condition.getElement().columnNumber,
      plugin,
      message:
        plugin.message + " Condition is " + expression.length + " characters."
    });
    hadWarn = true;
  }

  if (typeof cb == "function") {
    cb(null, hadWarn);
  }
};

module.exports = {
  plugin,
  onCondition
};
