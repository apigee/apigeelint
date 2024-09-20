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
  name: "TargetEndpoint HTTPTargetConnection LoadBalancer with duplicate Server elements",
  message: "Duplicate Server elements found within LoadBalancer.",
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
            message: "Multiple Server entries with IsFallback=true"
          });
          flagged = true;
        }

        const servers = xpath.select("Server", loadBalancer);
        if (servers.length > 1) {
          const previouslyDetected = [];
          servers.slice(0, -1).forEach((item, i) => {
            if (!previouslyDetected.includes(i)) {
              const dupesForI = [];
              const compares = servers.slice(i + 1);
              compares.forEach((c, j) => {
                const indexOfCompared = j + i + 1;
                if (!previouslyDetected.includes(indexOfCompared)) {
                  const attrsA = xpath.select("@*", item);
                  const attrsB = xpath.select("@*", c);
                  if (!attrsA || !attrsA.find((attr) => attr.name == "name")) {
                    endpoint.addMessage({
                      plugin,
                      line: item.lineNumber,
                      column: item.columnNumber,
                      message:
                        "Missing name attribute for server within LoadBalancer"
                    });
                    flagged = true;
                  } else {
                    const nameAttrA = attrsA.find(
                      (attr) => attr.name == "name"
                    );

                    if (attrsB) {
                      const nameAttrB = attrsB.find(
                        (attr) => attr.name == "name"
                      );
                      if (nameAttrB && nameAttrB.value == nameAttrA.value) {
                        debug(`duplicate found at index ${indexOfCompared}`);
                        dupesForI.push(indexOfCompared);
                      }
                    }
                  }
                }
              });

              if (dupesForI.length) {
                dupesForI.forEach((ix) =>
                  endpoint.addMessage({
                    plugin,
                    line: servers[ix].lineNumber,
                    column: servers[ix].columnNumber,
                    message: plugin.message
                  })
                );
                flagged = true;
                previouslyDetected.push(...dupesForI);
              }
            }
          });
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
