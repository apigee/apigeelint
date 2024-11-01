/*
  Copyright 2019-2020,2024 Google LLC

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
  name: "Check for multiple CORS policies",
  message:
    "Only one CORS Policy is necessary. It should attach in the Proxy Preflow.",
  fatal: false,
  severity: 2, // error
  nodeType: "Endpoint",
  enabled: true
};

const onProxyEndpoint = function (endpoint, cb) {
  debug("onProxyEndpoint");
  const checker = new EndpointChecker(endpoint, true);
  const flagged = checker.check();
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

const onTargetEndpoint = function (endpoint, cb) {
  debug("onTargetEndpoint");
  const checker = new EndpointChecker(endpoint, false);
  const flagged = checker.check();
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

const _markStep = (step, msg) => {
  let result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    entity: step,
    line: step.getElement().lineNumber,
    column: step.getElement().columnNumber,
    nodeType: "Step",
    message: msg
  };
  step.addMessage(result);
};

const _markEndpoint = (endpoint, msg) => {
  var result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    nodeType: plugin.nodeType,
    message: msg
  };
  endpoint.addMessage(result);
};

class EndpointChecker {
  constructor(endpoint, isProxyEndpoint) {
    debug("EndpointChecker ctor (%s)", endpoint.getName());
    this.endpoint = endpoint;
    this.bundle = endpoint.parent;
    this.isProxyEndpoint = isProxyEndpoint;
    this.flagged = false;
  }

  check() {
    try {
      this.corsPoliciesInBundle =
        this.bundle.policies &&
        this.bundle.policies
          .filter((policy) => policy.getType() === "CORS")
          .reduce(function (obj, policy) {
            obj[policy.getName()] = policy;
            return obj;
          }, {});

      if (this.corsPoliciesInBundle) {
        let keys = Object.keys(this.corsPoliciesInBundle);
        debug("CORS policies in endpoint: " + JSON.stringify(keys));

        // Ensure at most one attachment for any CORS policy,
        // or, conditions on all CORS policies.
        let corsStepsInEndpoint = this.endpoint
          .getSteps()
          .filter((step) => keys.indexOf(step.getName()) >= 0);

        if (this.isProxyEndpoint) {
          if (corsStepsInEndpoint.length > 1) {
            this.flagged =
              this._checkStepsForMissingConditions(corsStepsInEndpoint);
          } else {
            debug("zero or one CORS policies in this endpoint");
          }
        } else {
          if (corsStepsInEndpoint.length > 0) {
            corsStepsInEndpoint.forEach((step) => {
              _markStep(
                step,
                "There is a CORS policy attached to a TargetEndpoint.  Attach CORS policies to a ProxyEndpoint."
              );
            });
            this.flagged = true;
          }
        }
      }
      return this.flagged;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  _checkStepsForMissingConditions(steps) {
    let anyStepsLackCondition = steps.filter((step) => {
      if (!step.getCondition()) {
        let name = step.getName();
        _markStep(
          step,
          //this.corsPoliciesInBundle[name],
          `There are multiple CORS policies and policy ${name} is attached to a Step without a Condition.`
        );
        return true;
      }
    });

    if (anyStepsLackCondition.length > 0) {
      _markEndpoint(
        this.endpoint,
        "There are multiple CORS policies attached, at least one without a condition.  If you have more than one CORS policy, only the last one in the flow will be effective.  Wrap each one in a condition to make sure the correct one is used."
      );
      return true;
    }
  }
}

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
