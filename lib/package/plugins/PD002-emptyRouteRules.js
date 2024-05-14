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

const ruleId = require("../myUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "Unconditional Route Rule Structure",
  message:
    "Check RouteRules in a ProxyEndpoint to ensure that one and only one has a blank set of conditions.",
  fatal: false,
  severity: 2, //2=error
  nodeType: "RouteRule",
  enabled: true
};

const onProxyEndpoint = function (ep, cb) {
  const routeRules = ep.getRouteRules();
  let hadError = false;

  if (routeRules) {
    const blankRR = routeRules.filter(
      (rr) => !rr.getCondition() || rr.getCondition().getExpression() === ""
    );
    if (blankRR.length > 1) {
      blankRR.slice(1).forEach((rr) =>
        ep.addMessage({
          plugin,
          source: rr.getSource(),
          line: rr.getElement().lineNumber,
          column: rr.getElement().columnNumber,
          message: `Multiple RouteRules with no Condition. Only the first is evaluated.`
        })
      );
      hadError = true;
    } else if (blankRR.length == 0) {
      ep.addMessage({
        plugin,
        severity: 1, //1=warning
        message: `There is no RouteRule with no Condition. Your proxy may not operate correctly.`
      });
    }
  }
  if (typeof cb == "function") {
    cb(null, hadError);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};
