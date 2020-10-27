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

//checkRegexLookAround
//PO018 | Regex Lookahead/Lookbehind are Expensive - Threat Protection Policy

const xpath = require("xpath"),
      ruleId = require("../myUtil.js").getRuleId();

const plugin = {
        ruleId,
        name: "Regular Expression Lookarounds",
        message:
        "Regex Lookahead/Lookbehind are expensive, especially when applied to large text blocks, consider refactoring to a simpler regular expression.",
        fatal: false,
        severity: 1, //warn
        nodeType: "RegularExpressionProtection",
        enabled: true
      };

//need to check http://docs.apigee.com/api-services/reference/regular-expression-protection

const onPolicy = function(policy, cb) {
  let hadWarn = false;

  if (policy.getType() === "RegularExpressionProtection") {
    var patterns = xpath.select(".//Pattern/text()", policy.getElement());
    patterns.forEach(function(pattern) {
      if (pattern.data.includes("(?")) {
        //if the pattern includes ($
        policy.addMessage({
          plugin,
          line: pattern.lineNumber,
          column: pattern.columnNumber,
          source: pattern.data,
          message: "Lookaround in Regex can be inefficient."
        });
        hadWarn = true;
      }
    });
  }
  if (typeof(cb) == 'function') {
    cb(null, hadWarn);
  }
};

//and conditions http://docs.apigee.com/api-services/content/pattern-matching-conditional-statements

module.exports = {
  plugin,
  onPolicy
};
