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

const ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Unreachable Route Rules - empty conditions go last",
  message:
    "Check RouteRules in a ProxyEndpoint to ensure that empty condition is last.",
  fatal: false,
  severity: 2, // 2=error
  nodeType: "RouteRule",
  enabled: true
};

const processRouteRules = function (endpoint) {
  const rr = endpoint.getRouteRules();
  debug(`found ${rr.length} RouteRules`);
  let flagged = false;
  const unconditionalRoutes = rr.filter(
    (r) => !r.getCondition() || r.getCondition().getExpression() === ""
  );
  const lastUncRoute = unconditionalRoutes[unconditionalRoutes.length - 1];

  if (unconditionalRoutes.length > 0) {
    // The check for multiple RRs with no condition, is done by PD002.

    // check if unconditional is not final route
    const lastRoute = rr[rr.length - 1];
    if (lastRoute != lastUncRoute) {
      flagged = true;
      endpoint.addMessage({
        source: lastUncRoute.getSource(),
        line: lastUncRoute.getElement().lineNumber,
        column: lastUncRoute.getElement().columnNumber,
        plugin,
        message: `Endpoint has an unconditional RouteRule that is not the final RouteRule.`
      });
    }
  }
  return flagged;
};

const onProxyEndpoint = function (ep, cb) {
  const flagged = processRouteRules(ep);
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};
