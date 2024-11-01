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

//checkFaultRuleCondition
//FR001 | No Condition on FaultRule |

const ruleId = require("../lintUtil.js").getRuleId(),
      debug = require("debug")(`apigeelint:${ruleId}`),
      RULE_WARNING = 1,
      RULE_ERROR = 2,
      plugin = {
        ruleId,
        name: "No Condition on FaultRule",
        message:
        "With multiple FaultRules, all except one should have a condition statement.",
        fatal: false,
        severity: RULE_ERROR,
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
        if (allFaultRules.length > 1) {
          // check all but the first, or last, depending on whether Proxy or Target
          let rulesToCheck = (this.isProxyEndpoint)? allFaultRules.slice(1) : allFaultRules.slice(0, -1);
          rulesToCheck.forEach(fr => {
            if (!fr.getCondition() ||
                (fr.getCondition() &&
                 fr.getCondition().getExpression() === "")) {
              let name = fr.getName();
              fr.addMessage({
                plugin,
                severity: RULE_ERROR,
                line: fr.getElement().lineNumber,
                column: fr.getElement().columnNumber,
                message: `More than one FaultRule, and a FaultRule other than the fallback (${name}) has no Condition or the Condition is empty.`
              });
              this.flagged = true;
            }
          });
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
