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

//checkConditionTruth.js

var plugin = {
    ruleId: "CC006",
    name: "Detect Logical Absurdities",
    message: "Conditions should not have internal logic conflicts.",
    fatal: false,
    severity: 2, //error
    nodeType: "Condition",
    enabled: true
  };

var onCondition = function(condition, cb) {
  var truthTable = condition.getTruthTable(),
    hadErr = false;
  //truthTable will be null if no condition was present
  if (truthTable && truthTable.getEvaluation() !== "valid") {
    condition.addMessage({
      source: condition.getExpression(),
      line: condition.getElement().lineNumber,
      column: condition.getElement().columnNumber,
      plugin,
      message: "Condition may be a logical absuridty."
    });
    hadErr = true;
  }
  if (typeof cb == "function") {
    cb(null, hadErr);
  }
};

module.exports = {
  plugin,
  onCondition
};
