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

const ruleId = require("../myUtil.js").getRuleId(),
  xpath = require("xpath"),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check for Source in DataCapture policies",
  message: "Source should be explicit in DataCapture policy, in some cases.",
  fatal: false,
  severity: 2, // 2=error
  nodeType: "Endpoint",
  enabled: true
};

const onProxyEndpoint = function (endpoint, cb) {
  debug("onProxyEndpoint");
  const flagged = _checkEndpoint(endpoint, true);
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

const onTargetEndpoint = function (endpoint, cb) {
  debug("onTargetEndpoint");
  const flagged = _checkEndpoint(endpoint, false);
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

const _markEndpoint = (endpoint, message) =>
  endpoint.addMessage({
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    nodeType: plugin.nodeType,
    message
  });

const _checkPolicySource = (_step, policy, isResponsePhase) => {
  let flagged = true;
  // sanity
  if (policy.getType() === "DataCapture") {
    const captures = policy.select("/DataCapture/Capture");

    captures.forEach((capture) => {
      const collects = xpath.select("Collect", capture);
      const collect = collects && collects[0];
      const _markPolicy = (message) => {
        policy.addMessage({
          ruleId: plugin.ruleId,
          severity: plugin.severity,
          nodeType: "Policy",
          line: capture.lineNumber,
          column: capture.columnNumber,
          message
        });
        flagged = true;
      };

      if (!collect) {
        _markPolicy(
          "The DataCapture policy has a Capture with no Collect element."
        );
      } else {
        const sources = xpath.select("Source", collect);

        if (!isResponsePhase) {
          // request phase
          if (sources && sources[0]) {
            // There is a Source. Make sure it is not "response" or empty.
            const textValue =
              sources[0].childNodes &&
              sources[0].childNodes[0] &&
              sources[0].childNodes[0].nodeValue;

            if (textValue == "response") {
              _markPolicy(
                "The DataCapture policy is attached to a Request flow, and this Capture uses a response message as Source. The response is not yet available in the Request flow."
              );
            }
          }
        }

        const uripaths = xpath.select("URIPath", collect);
        if (uripaths && uripaths[0]) {
          if (isResponsePhase) {
            if (!sources || !sources[0]) {
              // no Source. this won't work
              _markPolicy(
                "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture does not specify a Source. Source should be a request message."
              );
            }
            if (sources && sources[0]) {
              // There is a Source. Make sure it is not "response" or "message".
              const textValue =
                sources[0].childNodes &&
                sources[0].childNodes[0] &&
                sources[0].childNodes[0].nodeValue;

              if (!textValue) {
                _markPolicy(
                  "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture uses an empty Source. Source should be a request message."
                );
              }
              if (textValue == "response" || textValue == "message") {
                _markPolicy(
                  "The DataCapture policy is attached to a Response flow, uses URIPath, and this Capture uses a response message as Source. Source should be a request message."
                );
              }
            }
          } else {
            // request phase
            if (sources && sources[0]) {
              // There is a Source. Make sure it is not empty.
              const textValue =
                sources[0].childNodes &&
                sources[0].childNodes[0] &&
                sources[0].childNodes[0].nodeValue;

              if (!textValue) {
                _markPolicy(
                  "The DataCapture policy is attached to a Request flow, uses URIPath, and this Capture uses an empty Source. Source should be absent, or a request message."
                );
              }
            } else {
              debug(
                "attached to Request phase, and No Source element - that's ok"
              );
            }
          }
        }
      }
    });
  }
  return flagged;
};

const _checkEndpoint = (endpoint, _isProxyEndpoint) => {
  debug("checkEndpoint (%s)", endpoint.getName());
  const bundle = endpoint.parent;

  // if this is a Sharedflow, don't check attachment.
  let flagged = false;
  if (bundle.bundleTypeName == "apiproxy") {
    try {
      const dcPoliciesInBundle =
        bundle.policies &&
        bundle.policies
          .filter((policy) => policy.getType() === "DataCapture")
          .reduce((obj, policy) => ((obj[policy.getName()] = policy), obj), {});

      if (dcPoliciesInBundle) {
        const keys = Object.keys(dcPoliciesInBundle);
        debug("DataCapture policies in bundle: " + JSON.stringify(keys));

        const phaseCheck = (phase, isResponse) => {
          if (phase) {
            phase.getSteps().forEach((step) => {
              // is this a DC Policy?
              const dcPolicy = dcPoliciesInBundle[step.getName()];
              if (dcPolicy) {
                debug(`checking DC policy ${dcPolicy.getName()}`);
                // check it for Source correctness
                flagged |= _checkPolicySource(step, dcPolicy, isResponse);
              }
            });
          }
        };
        endpoint.getAllFlows().forEach((flow) => {
          if (flow) {
            phaseCheck(flow.getFlowRequest(), false);
            phaseCheck(flow.getFlowResponse(), true);
          }
        });
      }

      return flagged;
    } catch (e) {
      console.log(e);
      _markEndpoint(endpoint, "Exception while processing: " + e.message);
      flagged = true;
    }
  }
  return flagged;
};

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
