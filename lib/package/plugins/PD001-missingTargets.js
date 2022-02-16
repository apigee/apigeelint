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

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Missing targets",
        message: "Check RouteRules in a ProxyEndpoint to ensure that the targets are known.",
        fatal: false,
        severity: 2, // 1 == warn, 2 == error
        nodeType: "RouteRule",
        enabled: true
      };

let thisBundle = null;
const onBundle = function(bundle, cb) {
        thisBundle = bundle;
        if (typeof(cb) == 'function') {
          cb(null, false);
        }
      };

const onProxyEndpoint =
  function(ep, cb) {
    const routeRules = ep.getRouteRules(),
          targets = thisBundle.getTargetEndpoints();
    let flagged = false;

    if (routeRules) {
      //let util = require('util');
    debug(`rr.length = ${routeRules.length}`);
      routeRules.forEach( (rr, ix) => {
        try {
          let targetName = rr.getTargetEndpoint();
          debug(`rr${ix} = "${targetName}"`);
          if (targetName == null) {
            // no-op
          }
          else if (targetName.trim()=== '') {
            ep.addMessage({
              plugin,
              source: rr.getSource(),
              line: rr.getElement().lineNumber,
              column: rr.getElement().columnNumber,
              message: `RouteRule specifies an empty TargetEndpoint.`
            });
            flagged = true;
          }
          else if ( ! targets.find( t => t.getName() == targetName)) {
            ep.addMessage({
              plugin,
              source: rr.getSource(),
              line: rr.getElement().lineNumber,
              column: rr.getElement().columnNumber,
              message: `RouteRule refers to an unknown TargetEndpoint (${targetName}).`
            });
            flagged = true;
          }
        } catch(exc1) {
          console.log('exception: ' + exc1.stack);
        }
    });
  }
  if (typeof(cb) == 'function') {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle,
  onProxyEndpoint
};
