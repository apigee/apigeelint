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

/* Check for:
 *
 * a. Retrieving things from a request message while (a) specifying a response
 *    Source, or (b) not specifying a source when attached in Response phase.
 *
 * b. Empty Source element.
 *
 * c. attributes on the Source element
 *
 */

const ruleId = require("../lintUtil.js").getRuleId(),
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

const _checkPolicyConfiguration = (_step, policy, isResponsePhase) => {
  let flagged = true;
  // sanity
  if (policy.getType() === "DataCapture") {
    const captures = policy.select("/DataCapture/Capture");

    captures.forEach((capture) => {
      const _markPolicy = (message, line, column) => {
        policy.addMessage({
          ruleId: plugin.ruleId,
          severity: plugin.severity,
          nodeType: "Policy",
          line: line || capture.lineNumber,
          column: column || capture.columnNumber,
          message
        });
        flagged = true;
      };
      const datacollectors = xpath.select("DataCollector", capture);
      const datacollector = datacollectors && datacollectors[0];
      debug(`datacollector: ${datacollector}`);

      if (datacollector) {
        if (datacollectors.length > 1) {
          _markPolicy(
            "The DataCapture policy has a Capture with more than one DataCollector element."
          );
        }
        // Only a single child node (TEXT) on DataCollector element
        if (datacollector.childNodes && datacollector.childNodes.length > 1) {
          _markPolicy(
            "The DataCollector element should be a simple TEXT node. No other child nodes.",
            datacollector.lineNumber,
            datacollector.columnNumber
          );
        } else {
          const textValue =
            datacollector.childNodes &&
            datacollector.childNodes[0] &&
            datacollector.childNodes[0].nodeValue;

          // Check that DataCollector is not empty.
          if (!textValue || !textValue.trim()) {
            _markPolicy(
              "The DataCollector element should specify a non-empty TEXT value.",
              datacollector.lineNumber,
              datacollector.columnNumber
            );
          }
        }
        // check attributes on DataCollector element
        const attrs = xpath.select("@*", datacollector);
        if (attrs) {
          attrs.forEach((attr) => {
            if (attr.name != "scope") {
              _markPolicy(
                `The DataCollector element should not specify the ${attr.name} attribute.`,
                datacollector.lineNumber,
                datacollector.columnNumber
              );
            }
          });
        }
      } else {
        _markPolicy(
          "The DataCapture policy has a Capture with no DataCollector element."
        );
      }

      const collects = xpath.select("Collect", capture);
      const collect = collects && collects[0];

      if (collect) {
        if (collects.length > 1) {
          _markPolicy(
            "The DataCapture policy has a Capture with more than one Collect element."
          );
        }

        // check attributes on DataCollector element
        const attrs = xpath.select("@*", collect);
        if (attrs) {
          attrs.forEach((attr) => {
            if (attr.name != "ref" && attr.name != "default") {
              _markPolicy(
                `The Collect element should not specify the ${attr.name} attribute.`,
                collect.lineNumber,
                collect.columnNumber
              );
            }
          });
          if (!attrs.find((attr) => attr.name == "default")) {
            _markPolicy(
              `The Collect element is missing the required default attribute.`,
              collect.lineNumber,
              collect.columnNumber
            );
          }
        }

        const sources = xpath.select("Source", collect);

        if (sources && sources[0]) {
          // At most one Source
          if (sources.length > 1) {
            _markPolicy(
              "There should be at most one Source element in each Capture in the DataCapture policy."
            );
          }

          const source = sources[0];

          // Only a single child node (TEXT) on Source element
          if (source.childNodes && source.childNodes.length > 1) {
            _markPolicy(
              "The Source element should be a simple TEXT node. No other child nodes.",
              source.lineNumber,
              source.columnNumber
            );
          } else {
            const textValue =
              sources[0].childNodes &&
              sources[0].childNodes[0] &&
              sources[0].childNodes[0].nodeValue;

            // Check that Source is not empty.
            if (!textValue || !textValue.trim()) {
              _markPolicy(
                "The Source element, when present, should specify a non-empty TEXT value.",
                sources[0].lineNumber,
                sources[0].columnNumber
              );
            }

            // Source must not be response, if attached to request flow
            if (textValue == "response" && !isResponsePhase) {
              _markPolicy(
                "The DataCapture policy is attached to a Request flow, and this Capture uses a response message as Source. The response is not yet available in the Request flow."
              );
            }
          }
          // No attributes on Source element
          const attrs = xpath.select("@*", sources[0]);

          if (attrs && attrs[0]) {
            _markPolicy(
              "The Source element, when present, should not specify any attributes."
            );
          }
        }

        const checkSourceForRequestCapture = (elementName) => {
          const elts = xpath.select(elementName, collect);
          if (elts && elts[0]) {
            if (isResponsePhase) {
              if (!sources || !sources[0]) {
                // no Source. this won't work
                _markPolicy(
                  `The DataCapture policy is attached to a Response flow, uses ${elementName}, and this Capture does not specify a Source. The Source will be the response message, and this will never match.`
                );
              }
              if (sources && sources[0]) {
                // There is a Source. Make sure it is not "response" or "message".
                const textValue =
                  sources[0].childNodes &&
                  sources[0].childNodes[0] &&
                  sources[0].childNodes[0].nodeValue;

                if (textValue == "response" || textValue == "message") {
                  _markPolicy(
                    `The DataCapture policy is attached to a Response flow, uses ${elementName}, and this Capture uses a response message as Source. Source should be a request message.`
                  );
                }
              }
            } else {
              debug("policy is attached to Request phase");
            }
          }
        };
        checkSourceForRequestCapture("URIPath");
        checkSourceForRequestCapture("QueryParam");
      } else {
        _markPolicy(
          "The DataCapture policy has a Capture with no Collect element."
        );
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
                flagged |= _checkPolicyConfiguration(
                  step,
                  dcPolicy,
                  isResponse
                );
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
