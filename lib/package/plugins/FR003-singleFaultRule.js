/*
  Copyright 2019-2022 Google LLC

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

//FR003 | Single FaultRule |

const ruleId = require("../lintUtil.js").getRuleId(),
      debug = require("debug")(`apigeelint:${ruleId}`),
      RULE_WARNING = 1,
      RULE_ERROR = 2,
      plugin = {
        ruleId,
        name: "Single FaultRule",
        message:
        "With a single FaultRule and no Condition, consider migrating to DefaultFaultRule.",
        fatal: false,
        severity: RULE_WARNING,
        nodeType: "FaultRule",
        enabled: true
      };

class EndpointChecker {
  constructor(endpoint, isProxyEndpoint, debug) {
    debug('EndpointChecker ctor (%s)', endpoint.getName());
    this.endpoint = endpoint;
    this.bundle = endpoint.parent;
    this.isProxyEndpoint = isProxyEndpoint;
    this.flagged = false;
  }

  check() {
    try {
      let allFaultRules = this.endpoint.getFaultRules();

      if (allFaultRules) {
        if (allFaultRules.length == 1) {
          let fr = allFaultRules[0];
          if (!fr.getCondition() ||
              (fr.getCondition() &&
               fr.getCondition().getExpression() === "")) {
            let name = fr.getName();
            fr.addMessage({
              plugin,
              severity: RULE_WARNING,
              line: fr.getElement().lineNumber,
              column: fr.getElement().columnNumber,
              message: `Just one FaultRule and no Condition. Consider migrating to DefaultFaultRule.`
            });
            this.flagged = true;
          }
        }
      }
      return this.flagged;
    }
    catch(e) {
      console.log(e);
      return false;
    }
  }
}

const onProxyEndpoint = function(endpoint, cb) {
        debug('onProxyEndpoint');
        let checker = new EndpointChecker(endpoint, true, debug);
        let flagged = checker.check();
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const onTargetEndpoint = function(endpoint, cb) {
        debug('onTargetEndpoint');
        let checker = new EndpointChecker(endpoint, false, debug);
        let flagged = checker.check();
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
