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
  name: "TargetEndpoint HTTPTargetConnection SSLInfo ClientAuthEnabled hygiene",
  message:
    "TargetEndpoint HTTPTargetConnection SSLInfo ClientAuthEnabled hygiene",
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
    try {
      const loadBalancers = htc.select("LoadBalancer");
      if (loadBalancers.length == 0) {
        const messages = [];
        const sslInfos = htc.select("SSLInfo");
        if (sslInfos.length == 1) {
          debug(`onTargetEndpoint sslInfos(${util.format(sslInfos)})`);
          const urls = htc.select("URL");
          if (urls.length == 1) {
            debug(`onTargetEndpoint url(${util.format(urls[0])})`);
            const endpointUrl =
              urls[0].childNodes &&
              urls[0].childNodes[0] &&
              urls[0].childNodes[0].nodeValue;
            if (endpointUrl) {
              const isHttps = endpointUrl.startsWith("https://");
              if (isHttps) {
                let elts = htc.select(`SSLInfo/ClientAuthEnabled`);
                const hasClientAuth =
                  elts &&
                  elts.length == 1 &&
                  elts[0].childNodes &&
                  elts[0].childNodes[0] &&
                  elts[0].childNodes[0].nodeValue == "true";

                // check for keystore, keyalias
                elts = htc.select(`SSLInfo/KeyStore`);
                const hasKeyStore =
                  elts &&
                  elts.length == 1 &&
                  elts[0].childNodes &&
                  elts[0].childNodes[0];
                elts = htc.select(`SSLInfo/KeyAlias`);
                const hasKeyAlias =
                  elts &&
                  elts.length == 1 &&
                  elts[0].childNodes &&
                  elts[0].childNodes[0];

                if (hasClientAuth && (!hasKeyStore || !hasKeyAlias)) {
                  messages.push(
                    "When ClientAuthEnabled = true, use a KeyStore and KeyAlias",
                  );
                }
                if (!hasClientAuth && (hasKeyStore || hasKeyAlias)) {
                  messages.push(
                    "When ClientAuthEnabled = false, do not use a KeyStore and KeyAlias",
                  );
                }
              }
            }
          }
          //debug(`onTargetEndpoint messages(${messages})`);
          messages.forEach((message) => {
            endpoint.addMessage({
              plugin,
              line: htc.getElement().lineNumber,
              column: htc.getElement().columnNumber,
              message,
            });
            debug(`onTargetEndpoint set flagged`);
            flagged = true;
          });
        }
      }
    } catch (exc1) {
      console.error("exception in TD013: " + exc1);
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
