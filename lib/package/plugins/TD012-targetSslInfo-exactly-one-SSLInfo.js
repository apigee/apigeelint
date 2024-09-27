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

const ruleId = require("../myUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "TargetEndpoint HTTPTargetConnection should have exactly one SSLInfo",
  message:
    "TargetEndpoint HTTPTargetConnection should have exactly one SSLInfo",
  fatal: false,
  severity: 1, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true
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
        const sslInfos = htc.select("SSLInfo");
        const endpointUrl =
          urls[0].childNodes &&
          urls[0].childNodes[0] &&
          urls[0].childNodes[0].nodeValue;
        const isHttps = endpointUrl.startsWith("https://");
        if (isHttps) {
          debug(
            `onTargetEndpoint sslInfos.length(${util.format(sslInfos.length)})`
          );
          if (sslInfos.length == 0) {
            endpoint.addMessage({
              plugin,
              line: htc.getElement().lineNumber,
              column: htc.getElement().columnNumber,
              message: plugin.message
            });
            flagged = true;
          } else if (sslInfos.length > 1) {
            endpoint.addMessage({
              plugin,
              line: sslInfos[1].lineNumber,
              column: sslInfos[1].columnNumber,
              message: plugin.message
            });
            flagged = true;
          }
        } else if (sslInfos.length == 1) {
          endpoint.addMessage({
            plugin,
            line: sslInfos[0].lineNumber,
            column: sslInfos[0].columnNumber,
            message: `SSLInfo should not be used with an insecure http url`
          });
          flagged = true;
        }
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
