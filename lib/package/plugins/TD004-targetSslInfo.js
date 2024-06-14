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
  name: "TargetEndpoint HTTPTargetConnection SSLInfo should use TrustStore",
  message:
    "TargetEndpoint HTTPTargetConnection should use TrustStore with SSLInfo.",
  fatal: false,
  severity: 1, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true
};

const path = require("path"),
  util = require("util"),
  debug = require("debug")("apigeelint:" + ruleId);

let bundleProfile = "apigee";
const onBundle = function (bundle, cb) {
  if (bundle.profile) {
    bundleProfile = bundle.profile;
  }
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const onTargetEndpoint = function (endpoint, cb) {
  const htc = endpoint.getHTTPTargetConnection(),
    shortFilename = path.basename(endpoint.getFileName());
  let flagged = false;

  debug(`onTargetEndpoint shortfile(${shortFilename})`);
  if (htc) {
    try {
      const messages = [];
      const urls = htc.select("URL");
      const loadBalancers = htc.select("LoadBalancer");
      const sslInfos = htc.select("SSLInfo");
      if (sslInfos.length > 1) {
        messages.push(`Incorrect multiple SSLInfo elements`);
      }
      if (urls.length > 1) {
        messages.push(`Incorrect multiple URL elements`);
      }
      if (loadBalancers.length > 1) {
        messages.push(`Incorrect multiple LoadBalancer elements`);
      }
      debug(`onTargetEndpoint sslInfos(${util.format(sslInfos)})`);
      if (urls.length > 0 && loadBalancers.length > 0) {
        messages.push(
          `Using both URL and LoadBalancer in a proxy leads to undefined behavior`
        );
      } else if (urls.length > 0) {
        if (urls.length > 1) {
          messages.push(`Multiple URL child elements is unsupported`);
        } else {
          debug(`onTargetEndpoint url(${util.format(urls[0])})`);

          const endpointUrl =
            urls[0].childNodes &&
            urls[0].childNodes[0] &&
            urls[0].childNodes[0].nodeValue;
          const isHttps = endpointUrl.startsWith("https://");
          if (isHttps) {
            if (sslInfos.length == 0) {
              messages.push(`Missing SSLInfo configuration`);
            } else {
              let elts = htc.select(`SSLInfo/Enabled`);
              const enabled =
                elts &&
                elts[0] &&
                elts[0].childNodes &&
                elts[0].childNodes[0] &&
                elts[0].childNodes[0].nodeValue == "true";
              if (!enabled) {
                messages.push(
                  "SSLInfo configuration does not use Enabled=true"
                );
              }

              elts = htc.select(`SSLInfo/Enforce`);
              let enforce =
                elts && elts[0] && elts[0].childNodes && elts[0].childNodes[0];
              if (bundleProfile == "apigeex") {
                enforce = enforce && enforce.nodeValue == "true";
                if (!enforce) {
                  messages.push(
                    "SSLInfo configuration does not use Enforce=true"
                  );
                }
              } else {
                if (enforce) {
                  messages.push(
                    "SSLInfo configuration must not use the Enforce element"
                  );
                }
              }

              elts = htc.select(`SSLInfo/IgnoreValidationErrors`);
              const ignoreErrors =
                elts &&
                elts[0] &&
                elts[0].childNodes &&
                elts[0].childNodes[0] &&
                elts[0].childNodes[0].nodeValue == "true";
              if (ignoreErrors) {
                messages.push(
                  "SSLInfo configuration includes IgnoreValidationErrors = true"
                );
              }

              elts = htc.select(`SSLInfo/ClientAuthEnabled`);
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
                  "When ClientAuthEnabled = true, use a KeyStore and KeyAlias"
                );
              }
              if (!hasClientAuth && (hasKeyStore || hasKeyAlias)) {
                messages.push(
                  "When ClientAuthEnabled = false, do not use a KeyStore and KeyAlias"
                );
              }
            }
          } else if (sslInfos.length == 1) {
            messages.push(
              `SSLInfo should not be used with an insecure http url`
            );
          }
        }
      } else if (loadBalancers.length > 0) {
        debug(`using at least one LoadBalancer`);
        if (loadBalancers.length > 1) {
          messages.push(`Multiple LoadBalancer child elements is unsupported`);
        }
      }

      //debug(`onTargetEndpoint messages(${messages})`);
      messages.forEach((message) => {
        endpoint.addMessage({
          plugin,
          line: htc.getElement().lineNumber,
          column: htc.getElement().columnNumber,
          message
        });
        debug(`onTargetEndpoint set flagged`);
        flagged = true;
      });
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
  onBundle,
  onTargetEndpoint
};
