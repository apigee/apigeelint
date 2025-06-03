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
  name: "TargetEndpoint HTTPTargetConnection URL should be non-empty",
  message: "TargetEndpoint HTTPTargetConnection URL should be non-empty",
  fatal: false,
  severity: 2, // 1 = warn, 2 = error
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
    try {
      const urls = htc.select("URL");
      if (urls.length == 1) {
        let endpointUrl =
          urls[0].childNodes &&
          urls[0].childNodes[0] &&
          urls[0].childNodes[0].nodeValue;
        endpointUrl = endpointUrl && endpointUrl.trim();
        if (!endpointUrl) {
          endpoint.addMessage({
            plugin,
            line: urls[0].lineNumber,
            column: urls[0].columnNumber,
            message: "URL element is present but empty in HTTPTargetConnection",
          });
          flagged = true;
        }
      }
    } catch (exc1) {
      console.error("exception in TD007: " + exc1);
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
