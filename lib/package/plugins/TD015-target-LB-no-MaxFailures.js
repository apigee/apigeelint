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
  name: "TargetEndpoint HTTPTargetConnection LoadBalancer should specify MaxFailures.",
  message:
    "TargetEndpoint HTTPTargetConnection LoadBalancer should specify MaxFailures.",
  fatal: false,
  severity: 1, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true,
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
        const recordIssue = (elt, msg) => {
          endpoint.addMessage({
            plugin,
            line: elt.lineNumber,
            column: elt.columnNumber,
            message: msg || plugin.message,
          });
          flagged = true;
        };

        const loadBalancer = loadBalancers[0];
        const serverElts = xpath.select("Server", loadBalancer);
        const maxFailuresElts = xpath.select("MaxFailures", loadBalancer);
        if (maxFailuresElts.length == 0) {
          if (serverElts.length != 1) {
            recordIssue(
              loadBalancer,
              "Missing MaxFailures element within LoadBalancer",
            );
          }
        } else if (maxFailuresElts.length == 1) {
          const maxFailures = maxFailuresElts[0];
          const maxFailStringValue =
            maxFailures.childNodes &&
            maxFailures.childNodes[0] &&
            maxFailures.childNodes[0].nodeValue;
          debug(`maxFailStringValue(${maxFailStringValue})`);
          if (!maxFailStringValue) {
            recordIssue(
              maxFailures,
              "MaxFailures element provides missing or empty TEXT",
            );
          } else {
            const maxFailValue = Number(
              maxFailStringValue && maxFailStringValue.trim(),
            );

            if (isNaN(maxFailValue)) {
              recordIssue(
                maxFailures,
                "MaxFailures element specifies a non-number",
              );
            }
            const isZero = maxFailStringValue == "0";
            const isPositiveInteger = new RegExp("^[1-9][0-9]*$").test(
              maxFailStringValue,
            );

            if (serverElts.length == 1) {
              // MaxFailures present with a single Server is ok, if maxfailures is zero
              if (!isZero) {
                recordIssue(
                  maxFailures,
                  "Non-zero MaxFailures should not be present in LoadBalancer with just one Server; Remove it or set MaxFailures to zero.",
                );
              }
            } else if (!isNaN(maxFailValue) && !isPositiveInteger) {
              recordIssue(
                maxFailures,
                "MaxFailures element should specify a positive integer",
              );
            }
          }
        } else {
          maxFailuresElts
            .slice(1)
            .forEach((maxFailures) =>
              recordIssue(
                maxFailure,
                "More than one MaxFailures element within LoadBalancer",
              ),
            );
        }
      }
    } catch (exc1) {
      console.error("exception in TD015: " + exc1);
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
