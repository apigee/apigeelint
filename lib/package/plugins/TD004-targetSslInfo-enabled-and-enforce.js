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
  name: "TargetEndpoint HTTPTargetConnection SSLInfo should use Enabled and Enforce correctly",
  message:
    "TargetEndpoint HTTPTargetConnection SSLInfo should use Enabled and Enforce correctly.",
  fatal: false,
  severity: 1, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true,
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
      const loadBalancers = htc.select("LoadBalancer");
      if (loadBalancers.length == 0) {
        const messages = [];
        const sslInfos = htc.select("SSLInfo");
        if (sslInfos.length == 1) {
          debug(`onTargetEndpoint sslInfos(${util.format(sslInfos)})`);
          const urls = htc.select("URL");
          if (urls.length >= 1) {
            debug(`onTargetEndpoint url(${util.format(urls[0])})`);
            const endpointUrl =
              urls[0].childNodes &&
              urls[0].childNodes[0] &&
              urls[0].childNodes[0].nodeValue;
            if (endpointUrl) {
              const isHttps = endpointUrl.startsWith("https://");
              let elts = htc.select(`SSLInfo/Enabled`);
              const enabled =
                elts &&
                elts[0] &&
                elts[0].childNodes &&
                elts[0].childNodes[0] &&
                elts[0].childNodes[0].nodeValue == "true";
              elts = htc.select(`SSLInfo/Enforce`);
              const enforce =
                elts &&
                elts[0] &&
                elts[0].childNodes &&
                elts[0].childNodes[0] &&
                elts[0].childNodes[0].nodeValue == "true";

              if (isHttps) {
                if (!enabled) {
                  messages.push(
                    "SSLInfo configuration does not use Enabled=true",
                  );
                }

                if (bundleProfile == "apigeex") {
                  if (!enforce) {
                    messages.push(
                      "SSLInfo configuration should use Enforce=true on profile=apigeex",
                    );
                  }
                } else {
                  if (enforce) {
                    messages.push(
                      "SSLInfo configuration must not use the Enforce element on profile=apigee",
                    );
                  }
                }
              } else {
                const isHttp = endpointUrl.startsWith("http://");
                if (isHttp) {
                  if (enabled) {
                    messages.push(
                      "SSLInfo configuration must not use the Enabled=true with insecure URL",
                    );
                  }
                  if (enforce) {
                    if (bundleProfile == "apigeex") {
                      messages.push(
                        "SSLInfo configuration must not use the Enforce=true with insecure URL",
                      );
                    } else {
                      messages.push(
                        "SSLInfo configuration should never use Enforce in profile=apigee, and also should not use Enforce=true with insecure URL",
                      );
                    }
                  }
                } else {
                  debug(
                    `HTTPTargetConnection/URL is neither https nor http. Probably variable (${endpointUrl})`,
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
      console.error("exception in TD004: " + exc1);
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
  onTargetEndpoint,
};
