/*
  Copyright 2019-2021 Google LLC

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
        name: "Unconditional Flows",
        message: "Only one unconditional flow will be executed.  Error if more than one detected.",
        fatal: true,
        severity: 2, //error
        nodeType: "Endpoint",
        enabled: true
      };

const debug = require("debug")(`apigeelint:${ruleId}`);

const searchUnconditionalFlowsInEndpoint =
  function(endpoint) {
    let flagged = false;

    let flows = endpoint.getFlows();
    debug(`found ${flows.length} Flows`);
    let unconditionalFlows =
      flows.filter( fl => (!fl.getCondition() ||
                                         fl.getCondition().getExpression() === "") );
    if (unconditionalFlows.length > 0) {
      debug(`found ${unconditionalFlows.length} Flows with no Condition`);
      let lastUncFlow = unconditionalFlows[unconditionalFlows.length - 1];
      // check if multiple
      if (unconditionalFlows.length > 1) {
        flagged = true;
        endpoint.addMessage({
          source: lastUncFlow.getSource(),
          line: lastUncFlow.getElement().lineNumber,
          column: lastUncFlow.getElement().columnNumber,
          plugin,
          message:
          `Endpoint has too many unconditional Flow elements (${unconditionalFlows.length}). Only one will be executed.`
        });
      }

      // check if unconditional is not final flow
      let lastFlow = flows[flows.length - 1];
      if (lastFlow != lastUncFlow) {
        flagged = true;
        endpoint.addMessage({
          source: lastUncFlow.getSource(),
          line: lastUncFlow.getElement().lineNumber,
          column: lastUncFlow.getElement().columnNumber,
          plugin,
          message:
          `Endpoint has an unconditional Flow that is not the final flow. It will be ignored.`
        });
      }
    }

    return flagged;
  };

const onProxyEndpoint = function(endpoint,cb) {
        // The search function has side effects. Do not refactor
        // to put it inside the conditional.
        let f1 = searchUnconditionalFlowsInEndpoint(endpoint);
        if (typeof cb == "function") {
          cb(f1);
        }
      };

const onTargetEndpoint = function(endpoint,cb) {
        let flagged = searchUnconditionalFlowsInEndpoint(endpoint);
        if (typeof cb == "function") {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
