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

const plugin = {
  ruleId: "EX-PO001",
  name: "Streaming",
  message: "Check for policies while streaming is enabled",
  fatal: false,
  severity: 2, // 1 = warn, 2 = error
  nodeType: "Bundle",
  enabled: true,
};

const onBundle = function (bundle, cb) {
  let flagged = false,
    isProxyStreamingEnabled = false,
    isTargetStreamingEnabled = false;
  const proxies = bundle.getProxyEndpoints();
  proxies.forEach((proxyEndpoint, _p) => {
    const httpProxyConnection = proxyEndpoint.getHTTPProxyConnection();
    if (httpProxyConnection) {
      let properties = httpProxyConnection.getProperties();
      if (
        properties &&
        (properties["request.streaming.enabled"] == "true" ||
          properties["response.streaming.enabled"] == "true")
      ) {
        isProxyStreamingEnabled = true;
      }
    }
  });
  const targets = bundle.getTargetEndpoints();
  targets.forEach((targetEndpoint, _t) => {
    const httpTargetConnection = targetEndpoint.getHTTPTargetConnection();
    if (httpTargetConnection) {
      let properties = httpTargetConnection.getProperties();
      if (
        properties &&
        (properties["request.streaming.enabled"] == "true" ||
          properties["response.streaming.enabled"] == "true")
      ) {
        isTargetStreamingEnabled = true;
      }
    }
  });

  if (isProxyStreamingEnabled || isTargetStreamingEnabled) {
    bundle.getPolicies().forEach(function (policy) {
      if (
        (policy.getType() === "AssignMessage" ||
          policy.getType() === "ExtractVariables") &&
        policy.getSteps().length > 0
      ) {
        bundle.addMessage({
          plugin,
          source: policy.getSource(),
          line: policy.getElement().lineNumber,
          column: policy.getElement().columnNumber,
          message:
            "ExtractVariables/AssignMessage policies not allowed when streaming is enabled",
        });
        flagged = true;
      }
    });
  }
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle,
};
