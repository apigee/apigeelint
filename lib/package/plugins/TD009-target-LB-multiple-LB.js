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

const ruleId = require("../lintUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "TargetEndpoint HTTPTargetConnection should have at most one LoadBalancer",
  message:
    "TargetEndpoint HTTPTargetConnection should not have more than one LoadBalancer.",
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

      if (loadBalancers.length > 1) {
        endpoint.addMessage({
          plugin,
          line: loadBalancers[1].lineNumber,
          column: loadBalancers[1].columnNumber,
          message: plugin.message
        });
        debug(`onTargetEndpoint set flagged`);
        flagged = true;
      }
    } catch (exc1) {
      console.error("exception: " + exc1);
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
  onTargetEndpoint
};
