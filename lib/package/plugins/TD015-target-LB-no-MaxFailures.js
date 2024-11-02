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
  xpath = require("xpath");

const plugin = {
  ruleId,
  name: "TargetEndpoint HTTPTargetConnection LoadBalancer should specify MaxFailures.",
  message:
    "TargetEndpoint HTTPTargetConnection LoadBalancer should specify MaxFailures.",
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
        const maxFailuresElts = xpath.select("MaxFailures", loadBalancer);
        if (maxFailuresElts.length == 0) {
          endpoint.addMessage({
            plugin,
            line: loadBalancer.lineNumber,
            column: loadBalancer.columnNumber,
            message: "Missing MaxFailures element within LoadBalancer"
          });
          flagged = true;
        } else if (maxFailuresElts.length == 1) {
          const maxFailures = maxFailuresElts[0];
          const maxFailStringValue =
            maxFailures.childNodes &&
            maxFailures.childNodes[0] &&
            maxFailures.childNodes[0].nodeValue;
          debug(`maxFailStringValue(${maxFailStringValue})`);
          const maxFailValue = Number(
            maxFailStringValue && maxFailStringValue.trim()
          );
          const intReg = new RegExp("^[1-9][0-9]*$");
          if (!maxFailStringValue) {
            endpoint.addMessage({
              plugin,
              line: maxFailures.lineNumber,
              column: maxFailures.columnNumber,
              message: "MaxFailures element provides missing or empty TEXT"
            });
            flagged = true;
          } else if (!intReg.test(maxFailStringValue)) {
            endpoint.addMessage({
              plugin,
              line: maxFailures.lineNumber,
              column: maxFailures.columnNumber,
              message: "MaxFailures element should specify a positive integer"
            });
            flagged = true;
          } else if (isNaN(maxFailValue)) {
            endpoint.addMessage({
              plugin,
              line: maxFailures.lineNumber,
              column: maxFailures.columnNumber,
              message: "MaxFailures element specifies a non-number"
            });
            flagged = true;
          }
        } else {
          endpoint.addMessage({
            plugin,
            line: loadBalancer.lineNumber,
            column: loadBalancer.columnNumber,
            message: "More than one MaxFailures element within LoadBalancer"
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
