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
  debug = require("debug")("apigeelint:" + ruleId),
  util = require("util"),
  xpath = require("xpath");

const plugin = {
  ruleId,
  name: "Unreachable Steps after RaiseFault",
  message: "Steps in the same flow after a RaiseFault cannot be reached.",
  fatal: false,
  severity: 1, //1=warning, 2=error
  nodeType: "Step",
  enabled: true,
};

let bundle = null;

class PolicyFlowChecker {
  constructor(plugin, debug) {
    debug(`PolicyFlowChecker ctor`);
    this.plugin = plugin;
    this.debug = debug;
  }

  checkSequence(stepParent, entity) {
    let flagged = false;
    const allSteps = stepParent.getSteps();
    // get the array of indexes
    const isUnconditionalRaiseFaults = allSteps.map((step) => {
      if (step.getCondition()) return false;
      let referredPolicy = bundle
        .getPolicies()
        .find((p) => p.getSteps().find((s) => s == step));
      if (!referredPolicy || referredPolicy.getType() !== "RaiseFault")
        return false;
      let enabled = referredPolicy.select("@enabled");
      enabled = enabled && enabled[0];
      if (!enabled || enabled == "true") return true;
      return false;
    });

    // just look at the FIRST one, skip all subsequent unconditional RF
    isUnconditionalRaiseFaults.find((found, ix) => {
      if (found) {
        const step = allSteps[ix];
        debug(
          `found an attached, unconditional RaiseFault policy, line ${step.getElement().lineNumber}`,
        );
        if (ix < allSteps.length - 1) {
          debug(`not last in flow`);
          allSteps.slice(ix + 1).forEach((unreachableStep) => {
            flagged = true;
            entity.addMessage({
              plugin: checker.plugin,
              source: unreachableStep.getElement().toString(),
              line: unreachableStep.getElement().lineNumber,
              column: unreachableStep.getElement().columnNumber,
              message: `Step ${unreachableStep.getName()} is attached after a RaiseFault, cannot be reached.`,
            });
          });
        }
        return true;
      }
      return false;
    });
    return flagged;
  }

  check(sequence) {
    let flagged = false;
    try {
      let debug = this.debug;
      let bundlePolicies = bundle.getPolicies();
      let checker = this;
      let sequenceType = sequence.constructor.name;
      debug(`thingType: ${sequenceType}`);
      if (sequenceType == "Flow") {
        const flow = sequence;
        debug(`flow.name: ${flow.name}`);

        ["FlowRequest", "FlowResponse", "SharedFlow"].forEach((m) => {
          const method = `get${m}`;
          debug(`calling flow.${method}()`);
          const flowPhase = flow[method]();
          if (flowPhase) {
            if (this.checkSequence(flowPhase, flow)) {
              flagged = true;
            }
          }
        });
      } else {
        if (this.checkSequence(sequence, sequence.getParent())) {
          flagged = true;
        }
      }
    } catch (exc1) {
      flagged = true;
      sequence.addMessage({
        plugin: checker.plugin,
        message: exc1.message + exc1.stack,
      });
    }

    return flagged;
  }
}

const checker = new PolicyFlowChecker(plugin, debug);

const checkEndpoint = function (endpoint, cb) {
  let flagged = false;
  try {
    endpoint.getAllFlows().forEach((sequence, ix) => {
      if (checker.check(sequence)) {
        flagged = true;
      }
    });
    endpoint.getFaultRules().forEach((sequence) => {
      if (checker.check(sequence)) {
        flagged = true;
      }
    });
    if (endpoint.getDefaultFaultRule()) {
      if (checker.check(endpoint.getDefaultFaultRule())) {
        flagged = true;
      }
    }
  } catch (exc1) {
    endpoint.addMessage({
      plugin: checker.plugin,
      message: exc1.message + " " + exc1.stack,
    });
  }

  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

const onProxyEndpoint = function (endpoint, cb) {
  debug("onProxyEndpoint");
  checkEndpoint(endpoint, cb);
};

const onTargetEndpoint = function (endpoint, cb) {
  debug("onTargetEndpoint");
  checkEndpoint(endpoint, cb);
};

const onBundle = function (b, cb) {
  bundle = b;
};

module.exports = {
  plugin,
  onBundle,
  onProxyEndpoint,
  onTargetEndpoint,
};
