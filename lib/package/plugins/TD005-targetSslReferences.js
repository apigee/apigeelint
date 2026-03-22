/*
  Copyright © 2019-2022,2026 Google LLC

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
  path = require("path"),
  util = require("util"),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "TargetEndpoint SSLInfo references",
  message:
    "TargetEndpoint SSLInfo should use reference within TrustStore or KeyStore.",
  fatal: false,
  severity: 1, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true,
};

const onTargetEndpoint = function (endpoint, cb) {
  const htc = endpoint.getHTTPTargetConnection(),
    shortFilename = path.basename(endpoint.getFileName());
  let flagged = false;

  debug(`onTargetEndpoint shortfile(${shortFilename})`);
  if (htc) {
    try {
      const sslInfos = htc.select("SSLInfo");
      debug(`onTargetEndpoint sslInfos(${util.format(sslInfos)})`);
      if (sslInfos.length == 1) {
        let elts = htc.select(`SSLInfo/TrustStore`);
        if (elts.length > 1) {
          endpoint.addMessage({
            plugin,
            line: elts[0].lineNumber,
            column: elts[0].columnNumber,
            message: `Incorrect multiple TrustStore elements`,
          });
          flagged = true;
        }
        const trustStoreElt = elts && elts.length == 1 && elts[0];
        if (trustStoreElt) {
          const trustStoreName =
            trustStoreElt.childNodes &&
            elts[0].childNodes[0] &&
            elts[0].childNodes[0].nodeValue;
          if (trustStoreName && !trustStoreName.startsWith("ref://")) {
            endpoint.addMessage({
              plugin,
              line: trustStoreElt.lineNumber,
              column: trustStoreElt.columnNumber,
              message: "When using a TrustStore, use a reference",
            });
            flagged = true;
          }
        }

        elts = htc.select(`SSLInfo/KeyStore`);
        if (elts.length > 1) {
          endpoint.addMessage({
            plugin,
            line: elts[0].lineNumber,
            column: elts[0].columnNumber,
            message: `Incorrect multiple KeyStore elements`,
          });
          flagged = true;
        }
        const keyStoreElt = elts && elts.length == 1 && elts[0];
        if (keyStoreElt) {
          const keyStoreName =
            keyStoreElt.childNodes &&
            keyStoreElt.childNodes[0] &&
            keyStoreElt.childNodes[0].nodeValue;
          if (keyStoreName && !keyStoreName.startsWith("ref://")) {
            endpoint.addMessage({
              plugin,
              line: keyStoreElt.lineNumber,
              column: keyStoreElt.columnNumber,
              message: "When using a KeyStore, use a reference",
            });
            flagged = true;
          }
        }
      }
      /* c8 ignore start */
    } catch (exc1) {
      console.error("exception in TD005: " + exc1);
      debug(`onTargetEndpoint exc(${exc1})`);
      debug(`${exc1.stack}`);
    }
    /* c8 ignore stop */
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
