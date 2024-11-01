/*
  Copyright 2019-2022 Google LLC

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
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Unnecessary VirtualHost in X/hybrid",
        message:
        "There should be no VirtualHost in a ProxyEndpoint for ApigeeX.",
        fatal: false,
        severity: 1, //1=warn
        nodeType: "HTTPProxyConnection",
        enabled: true
      };

let profile = "apigee";
const onBundle = function(bundle, cb) {
  profile = bundle.profile;
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const onProxyEndpoint =
  function(ep, cb) {
    if (ep.getType() == 'ProxyEndpoint') { // exclude SharedFlows
      let connections = ep.select('/ProxyEndpoint/HTTPProxyConnection'),
          flagged = false;

      debug(`found ${connections.length} HTTPProxyConnection elements`);
      if (connections.length) {
        if (connections.length > 1) {
          flagged = true;
          connections.slice(1)
            .forEach( c =>
                      ep.addMessage({
                        plugin,
                        line: c.lineNumber,
                        column: c.columnNumber,
                        message: `Multiple HTTPProxyConnection elements.`
                      }));
        }
        else if (profile == 'apigeex') {
          // there is exactly 1 element, check for VirtualHost if apigeex
          ep.select('/ProxyEndpoint/HTTPProxyConnection/VirtualHost')
            .forEach(vhost => {
              ep.addMessage({
                plugin,
                line: vhost.lineNumber,
                column: vhost.columnNumber,
                message: `Unnecessary VirtualHost element.`
              });
              flagged = true;
            });
        }
      }
      else {
        ep.addMessage({
          plugin,
          message: `Missing HTTPProxyConnection.`
        });
        flagged = true;
      }
      if (typeof(cb) == 'function') {
        cb(null, flagged);
      }
    }
};

module.exports = {
  plugin,
  onBundle,
  onProxyEndpoint
};
