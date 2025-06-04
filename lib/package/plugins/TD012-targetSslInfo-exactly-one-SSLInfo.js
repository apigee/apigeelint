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

const ruleId = require("../lintUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "TargetEndpoint HTTPTargetConnection should have exactly one SSLInfo",
  message:
    "TargetEndpoint HTTPTargetConnection should have exactly one SSLInfo",
  fatal: false,
  severity: 1, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true,
};

const path = require("path"),
  util = require("util"),
  debug = require("debug")("apigeelint:" + ruleId);

const onTargetEndpoint = function (endpoint, cb) {
  const htc = endpoint.getHTTPTargetConnection(),
    shortFilename = path.basename(endpoint.getFileName());
  let flagged = false;

  debug(`onTargetEndpoint shortfile(${shortFilename})`);
  if (htc) {
    const recordIssue = (elt, msg) => {
      endpoint.addMessage({
        plugin,
        line: elt.lineNumber,
        column: elt.columnNumber,
        message: msg || plugin.message,
      });
      flagged = true;
    };
    try {
      const urls = htc.select("URL");
      const loadBalancers = htc.select("LoadBalancer");
      const sslInfos = htc.select("SSLInfo");
      if (urls.length == 1) {
        const endpointUrl =
          urls[0] &&
          urls[0].childNodes &&
          urls[0].childNodes[0] &&
          urls[0].childNodes[0].nodeValue;
        if (endpointUrl) {
          const isHttps = endpointUrl.startsWith("https://");
          if (isHttps) {
            debug(
              `onTargetEndpoint sslInfos.length(${util.format(sslInfos.length)})`,
            );
            if (sslInfos.length == 0) {
              recordIssue(
                htc.getElement(),
                "TargetEndpoint HTTPTargetConnection is missing SSLInfo configuration",
              );
            } else if (sslInfos.length > 1) {
              sslInfos
                .slice(1)
                .forEach((sslInfo) =>
                  recordIssue(
                    sslInfo,
                    "TargetEndpoint HTTPTargetConnection has more than one SSLInfo",
                  ),
                );
            }
          } else if (sslInfos.length > 0) {
            recordIssue(
              sslInfos[0],
              `SSLInfo should not be used with an insecure http url`,
            );
          }
        }
      } else if (loadBalancers.length == 1) {
        if (sslInfos.length > 1) {
          sslInfos
            .slice(1)
            .forEach((sslInfo) =>
              recordIssue(
                sslInfo,
                "TargetEndpoint HTTPTargetConnection has more than one SSLInfo",
              ),
            );
        }
      }
    } catch (exc1) {
      console.error("exception in TD012: " + exc1);
      debug(`onTargetEndpoint exc(${exc1})`);
      debug(`${exc1.stack}`);
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
