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

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
    ruleId,
    name: "Unreachable Route Rules - empty conditions go last",
    message:
      "Check RouteRules in a ProxyEndpoint to ensure that empty condition is last.",
    fatal: false,
    severity: 2, //error
    nodeType: "RouteRule",
    enabled: true
      };

const onProxyEndpoint = function(ep, cb) {
  let routeRules = ep.getRouteRules() || [],
    hadError = false;
  for (var i = routeRules.length - 2; i >= 0; i--) {
    var c = routeRules[i].getCondition();
    if ( ! c || c.getExpression() === "") {
      ep.addMessage({
        plugin,
        message:
          "RouteRule at line " +
          routeRules[i].getElement().lineNumber +
          " has an empty condition and is not the last RouteRule defined. Evaluation of RouteRules proceeds from top to bottom, the first match is executed. Additional RouteRules are therefore unreachable."
      });
      hadError = true;
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
