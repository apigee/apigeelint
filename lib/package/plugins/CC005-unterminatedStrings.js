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

// CC005-unterminatedStrings.js

const util = require("util"),
  ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "unterminatedStrings",
  message: "Conditions should not include strings that are unterminated.",
  fatal: false,
  severity: 2, //error
  nodeType: "Condition",
  enabled: true,
};

const isOdd = (num) => num % 2;

const onCondition = function (condition, cb) {
  let truthTable = condition.getTruthTable(),
    values = truthTable.getVals(),
    tokens = truthTable.getTokens(),
    source = condition.getSource(),
    ast = truthTable.getAST(),
    flagged = false;

  try {
    debug(`source(${source}) values(${values})`);
    debug(`values(` + JSON.stringify(values) + `)`);
    debug(`tokens(` + JSON.stringify(tokens) + `)`);
    debug(`ast(` + JSON.stringify(ast, null, 2) + `)`);

    // let invalid = tokens.filter( t => t.valid == false);
    // invalid.forEach( t => {
    //   condition.addMessage({
    //     source: condition.getExpression(),
    //     line: condition.getElement().lineNumber,
    //     column: condition.getElement().columnNumber,
    //     plugin,
    //     message: `invalid token. (${t.value})`
    //   });
    //   flagged = true;
    // });

    let constants = tokens.filter((t) => t.type == "constant");
    constants.forEach((t) => {
      debug(
        `constant type(${typeof t.value}) value(${JSON.stringify(t.value)})`,
      );
      if (typeof t.value == "string") {
        if (
          (t.value.endsWith('"') && !t.value.startsWith('"')) ||
          (!t.value.endsWith('"') && t.value.startsWith('"'))
        ) {
          condition.addMessage({
            source: condition.getExpression(),
            line: condition.getElement().lineNumber,
            column: condition.getElement().columnNumber,
            plugin,
            message: `Possible unterminated string: (${t.value})`,
          });
          flagged = true;
        }
      }
    });

    let boundaries = tokens.filter((t) => t.type == "boundary");
    debug(`boundaries(` + JSON.stringify(boundaries) + `)`);
    debug(`boundaries.length(${boundaries.length})`);
    if (isOdd(boundaries.length)) {
      condition.addMessage({
        source: condition.getExpression(),
        line: condition.getElement().lineNumber,
        column: condition.getElement().columnNumber,
        plugin,
        message:
          "unmatched parenthesis - possibly due to an unterminated string",
      });
      flagged = true;
    }
  } catch (e) {
    console.error("exception: " + e);
  }
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onCondition,
};
