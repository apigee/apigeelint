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
  name: "TargetEndpoint HTTPTargetConnection SSLInfo with LoadBalancer",
  message:
    "Configure SSLInfo in the TargetServer, even if SSLInfo is also present under HTTPTargetConnection",
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
      const sslInfos = htc.select("SSLInfo");
      debug(
        `sslInfos (${sslInfos.length}) loadBalancers(${loadBalancers.length})`,
      );

      if (loadBalancers.length == 1) {
        if (sslInfos.length > 0) {
          endpoint.addMessage({
            plugin,
            line: sslInfos[0].lineNumber,
            column: sslInfos[0].columnNumber,
            message: `When using a LoadBalancer, configure SSLInfo in the TargetServer, even if SSLInfo is also present under HTTPTargetConnection`,
          });
          debug(`onTargetEndpoint set flagged`);
          flagged = true;
        }
      }
    } catch (exc1) {
      console.error("exception in TD006: " + exc1);
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
