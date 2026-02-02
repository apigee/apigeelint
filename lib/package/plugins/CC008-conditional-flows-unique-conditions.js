/*
  Copyright © 2019-2026 Google LLC

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

const ruleId = require("../lintUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "Uniqueness of conditions in Flows, FaultRules, and RouteRules",
  message: "Each condition must be unique.  Error if duplicates.",
  fatal: true,
  severity: 2, //2= error
  nodeType: "Endpoint",
  enabled: true,
};
const parser = require("../../../build/ConditionParser.js");
const conditionComparison = require("./_conditionComparison.js");
const debug = require("debug")(`apigeelint:${ruleId}`);
const util = require("node:util");

const checkDuplicateConditions = function (
  flag,
  endpoint,
  flowsOrRules,
  label,
) {
  debug(`endpoint (${endpoint.getName()})  ${flowsOrRules.length} ${label}`);
  const withConditions = flowsOrRules.filter(
    (f) => f.getCondition() && f.getCondition().getExpression() !== "",
  );

  const shortLabel = (() => {
    let parts = label.split(" ");
    return parts[parts.length - 1];
  })();

  if (withConditions.length > 0) {
    let seen = {};
    debug(
      `endpoint (${endpoint.getName()})  ${withConditions.length} ${label} with Condition`,
    );

    withConditions.forEach((flow) => {
      debug(
        `name(${flow.getName()}) expr(${flow.getCondition().getExpression()})`,
      );

      if (seen[flow.getName()]) {
        flag(
          flow,
          `Duplicate name on ${label}: ${flow.getName()} (see previous on line ${seen[flow.getName()].sourceLine}).`,
        );
      } else {
        debug(`name(${flow.getName()}) unique name`);
        const expr = flow.condition.getExpression().trim();
        try {
          const current = parser.parse(expr);
          const canonicalCurrent = conditionComparison.canonicalize(current);
          // record that this has been seen
          seen[flow.getName()] = {
            parsedExpr: current,
            sourceLine: flow.getElement().lineNumber,
          };
          // check whether this expression is equivalent to any existing expression.
          debug(`parsed: ${util.format(current)}`);
          const repeat = Object.keys(seen).find((key) => {
            const previous = seen[key];
            return (
              previous.c14n &&
              canonicalCurrent.signature == previous.c14n.signature
            );
          });
          if (repeat) {
            flag(
              flow,
              `Logically equivalent conditions, ${shortLabel} ${flow.getName()} and ${repeat} (starting on line ${seen[repeat].sourceLine}).`,
            );
          } else {
            debug(`name(${flow.getName()}) not a repeat `);
            seen[flow.getName()].c14n = canonicalCurrent;
          }
        } catch (e) {
          // Nothing to do here.
          // Bad expression syntax is caught by a different lint plugin.
          debug(`ERROR while parsing condition expression: ` + util.format(e));
        }
      }
    });
  }
};

const searchConditionalFlowsInEndpoint = function (endpoint) {
  let flagged = false;
  const flag = (flow, message) => {
    flagged = true;
    endpoint.addMessage({
      source: flow.getSource(),
      line: flow.getElement().lineNumber,
      column: flow.getElement().columnNumber,
      plugin,
      message,
    });
  };
  checkDuplicateConditions(
    flag,
    endpoint,
    endpoint.getFlows(),
    "Conditional Flows",
  );
  checkDuplicateConditions(
    flag,
    endpoint,
    endpoint.getFaultRules(),
    "FaultRules",
  );

  // RouteRules apply only in ProxyEndpoints
  const routeRules = endpoint.getRouteRules();
  if (routeRules) {
    checkDuplicateConditions(flag, endpoint, routeRules, "RouteRules");
  }

  return flagged;
};

const onProxyEndpoint = function (endpoint, cb) {
  const flagged = searchConditionalFlowsInEndpoint(endpoint);
  if (typeof cb == "function") {
    cb(null, flagged);
  }
  return flagged;
};

const onTargetEndpoint = function (endpoint, cb) {
  const flagged = searchConditionalFlowsInEndpoint(endpoint);
  if (typeof cb == "function") {
    cb(null, flagged);
  }
  return flagged;
};

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint,
};
