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
        name: "Unconditional Flows",
        message: "Only one unconditional flow will be executed.  Error if more than one detected.",
        fatal: true,
        severity: 2, //error
        nodeType: "Endpoint",
        enabled: true
      };

let lastFlow, hadWarning=false;

const searchUnconditionalFlowsInEndpoint = function(endpoint) {
      var unconditionalFlows = 0;
      if (endpoint.getFlows()) {
        endpoint.getFlows().forEach(function(fl) {
          if (!fl.getCondition() || fl.getCondition().getExpression() === "") {
            unconditionalFlows++;
            lastFlow = fl;
          }
        });
      }

  if (unconditionalFlows > 1) {
    hadWarning=true;
    endpoint.addMessage({
      source: lastFlow.getSource(),
      line: lastFlow.getElement().lineNumber,
      column: lastFlow.getElement().columnNumber,
      plugin,
      message:
        "Endpoint has too many uncondtional flows (" +
        unconditionalFlows +
        ").  Only one will be executed."
    });
  }
};

// TODO: expand to include RouteRules conditions when that is implemented

var onProxyEndpoint = function(endpoint,cb) {
  searchUnconditionalFlowsInEndpoint(endpoint);
  if (typeof cb == "function") {
    cb(hadWarning);
  }
};

var onTargetEndpoint = function(endpoint,cb) {
  searchUnconditionalFlowsInEndpoint(endpoint);
  if (typeof cb == "function") {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
