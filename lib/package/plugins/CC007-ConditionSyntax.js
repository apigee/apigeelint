/*
  Copyright 2019-2024 Google LLC

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

const ruleId = require("../myUtil.js").getRuleId(),
  util = require("util"),
  debug = require("debug")("apigeelint:" + ruleId);
const parser = require("../../../build/ConditionParser.js");

const plugin = {
  ruleId,
  name: "Condition Syntax",
  fatal: false,
  severity: 2, //error
  nodeType: "Condition",
  enabled: true
};

const onCondition = function (condition, cb) {
  debug(`onCondition (${condition.getExpression()})`);
  let flagged = false;
  const expr = condition.getExpression().trim();
  try {
    parser.parse(expr);
  } catch (e) {
    debug(util.format(e));
    flagged = true;
    const estr = e.toString(),
      loc = e.location.start.column;
    condition.addMessage({
      source: condition.getExpression(),
      line: condition.getElement().lineNumber,
      column: condition.getElement().columnNumber,
      plugin,
      message: `Condition expression is invalid. Position ${loc}, ${estr}`
    });
  }

  if (typeof cb == "function") {
    cb(null, flagged);
  }
  return flagged;
};

module.exports = {
  plugin,
  onCondition
};
