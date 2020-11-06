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

const plugin = {
        ruleId : require("../myUtil.js").getRuleId(),
        name: "Overly Complex Condition",
        message:
        "Condition complexity should be limited to a relatively modest number of variables, constants, and comparators.",
        fatal: false,
        severity: 1, //warning
        nodeType: "Condition",
        enabled: true
      },
      threshold = 12;

const onCondition = function(condition, cb) {
  condition.getTruthTable().getAST(function(ast) {
    let nodeCount = 0,
        nodes = [ast];

    while (nodes[0]) {
      var node = nodes.pop();
      if (node.action !== "substitution") {
        nodeCount++;
      }

      if (node.args) {
        Array.prototype.push.apply(nodes, node.args);
      }
    }

    if (nodeCount > threshold) {
      condition.addMessage({
        source: condition.getExpression(),
        line: condition.getElement().lineNumber,
        column: condition.getElement().columnNumber,
        plugin,
        message:
          "Condition contains a high number of terms variables, constants, and comparators (" +
          nodeCount +
          ")."
      });
    }
    if (typeof cb == "function") {
      cb(null, nodeCount );
    }
  });
};

module.exports = {
  plugin,
  onCondition
};
