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

const ruleId = require("../myUtil.js").getRuleId(),
  xpath = require("xpath");

const plugin = {
  ruleId,
  name: "TargetEndpoint HTTPTargetConnection LoadBalancer with multiple fallback entries",
  message: "Multiple Server entries with IsFallback=true",
  fatal: false,
  severity: 1, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true
};

const path = require("path"),
  debug = require("debug")("apigeelint:" + ruleId);

const onTargetEndpoint = function (endpoint, cb) {
  const htc = endpoint.getHTTPTargetConnection(),
    shortFilename = path.basename(endpoint.getFileName());
  let flagged = false;

  debug(`onTargetEndpoint shortfile(${shortFilename})`);
  if (htc) {
    try {
      const loadBalancers = htc.select("LoadBalancer");
      debug(`loadBalancers(${loadBalancers.length})`);

      if (loadBalancers.length == 1) {
        const loadBalancer = loadBalancers[0];
        // check multiple fallbacks
        const fallbacks = xpath.select(
          "Server[IsFallback = 'true']",
          loadBalancer
        );
        if (fallbacks.length > 1) {
          endpoint.addMessage({
            plugin,
            line: loadBalancers[0].lineNumber,
            column: loadBalancers[0].columnNumber,
            message: plugin.message
          });
          flagged = true;
        }
        const servers = xpath.select("Server", loadBalancer);
        if (servers.length == 1 && fallbacks.length == 1) {
          endpoint.addMessage({
            plugin,
            line: loadBalancers[0].lineNumber,
            column: loadBalancers[0].columnNumber,
            message:
              "Only one server in a Load balancer; should not be marked IsFallback"
          });
          flagged = true;
        }
      }
    } catch (exc1) {
      console.error("exception: " + exc1);
      debug(`onTargetEndpoint exc(${exc1})`);
      debug(`${exc1.stack}`);
      endpoint.addMessage({
        plugin,
        message: "Exception while processing: " + exc1
      });

      flagged = true;
    }
  }

  if (typeof cb == "function") {
    debug(`onTargetEndpoint isFlagged(${flagged})`);
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onTargetEndpoint
};
