/*
  Copyright 2019-2025 Google LLC

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
  name: "Check TargetEndpoint HTTPTargetConnection HealthMonitor with LoadBalancer.",
  message:
    "TargetEndpoint HTTPTargetConnection should not use HealthMonitor without LoadBalancer.",
  fatal: false,
  severity: 2, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true,
};

const path = require("path"),
  debug = require("debug")("apigeelint:" + ruleId);

const checkForZero = (maxFailures) => {
  const maxFailStringValue =
    maxFailures.childNodes &&
    maxFailures.childNodes[0] &&
    maxFailures.childNodes[0].nodeValue;
  return maxFailStringValue && maxFailStringValue == "0";
};

const onTargetEndpoint = function (endpoint, cb) {
  const htc = endpoint.getHTTPTargetConnection(),
    shortFilename = path.basename(endpoint.getFileName());
  let flagged = false;
  const flag = (elt, msg, severity) => {
    endpoint.addMessage({
      plugin,
      line: elt.lineNumber,
      column: elt.columnNumber,
      message: msg || plugin.message,
      severity: severity || plugin.severity,
    });
    flagged = true;
  };
  const warn = (elt, msg) => flag(elt, msg, 1);
  const error = (elt, msg) => flag(elt, msg, 2);
  debug(`onTargetEndpoint shortfile(${shortFilename})`);
  if (htc) {
    try {
      const loadBalancers = htc.select("LoadBalancer");
      debug(`loadBalancers(${loadBalancers.length})`);
      const healthMonitors = htc.select("HealthMonitor");
      debug(`healthMonitors(${healthMonitors.length})`);

      if (loadBalancers.length == 0) {
        if (healthMonitors.length > 0) {
          error(
            healthMonitors[0],
            "TargetEndpoint HTTPTargetConnection should not use HealthMonitor without LoadBalancer.",
          );
        }
      } else if (loadBalancers.length == 1) {
        if (healthMonitors.length == 0) {
          // warn if MaxFailures is present, and MaxFailures != 0
          const loadBalancer = loadBalancers[0];
          const serverElts = xpath.select("Server", loadBalancer);
          const maxFailuresElts = xpath.select("MaxFailures", loadBalancer);
          const maxFailuresIsPresent = maxFailuresElts.length == 1;
          const isZero =
            maxFailuresIsPresent && checkForZero(maxFailuresElts[0]);
          if (maxFailuresIsPresent && !isZero) {
            warn(
              loadBalancer,
              "TargetEndpoint HTTPTargetConnection should use HealthMonitor with LoadBalancer when MaxFailures != 0.",
            );
          }
        }
      }
    } catch (exc1) {
      console.error("exception: " + exc1);
      debug(`onTargetEndpoint exc(${exc1})`);
      debug(`${exc1.stack}`);
      endpoint.addMessage({
        plugin,
        message: "Exception while processing: " + exc1,
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
  onTargetEndpoint,
};
