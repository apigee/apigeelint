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

const ruleId = require("../lintUtil.js").getRuleId(),
  util = require("util"),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check for unreferenced targets",
  message:
    "Unreferenced targets are dead code; should be removed from bundles.",
  fatal: false,
  severity: 1, //1=warn, 2=error
  nodeType: "Bundle",
  enabled: true,
};

const onBundle = function (bundle, cb) {
  const proxies = bundle.getProxyEndpoints(),
    targets = bundle
      .getTargetEndpoints()
      .reduce((a, c) => ((a[c.getName()] = { count: 0, ep: c }), a), {});
  debug(`targetmap: ${util.format(targets)}`);
  let flagged = false;
  if (Object.keys(targets).length) {
    proxies.forEach((proxyEndpoint, _pix) => {
      const routeRules = proxyEndpoint.getRouteRules();
      routeRules.forEach((rr, rrix) => {
        const targetName = rr.getTargetEndpoint();
        debug(`rr${rrix} = "${targetName}"`);
        if (targetName) {
          if (targets[targetName]) {
            targets[targetName].count++;
          } else {
            // unknown target - caught by a different plugin
          }
        }
      });
    });
    const unreferenced = Object.keys(targets).filter(
      (key) => targets[key].count == 0,
    );
    if (unreferenced.length) {
      try {
        flagged = true;
        unreferenced.forEach((tepname) => {
          debug(`unreferenced: ${tepname}`);
          targets[tepname].ep.addMessage({
            plugin,
            //entity: targets[tepname].ep,
            message: `Unreferenced TargetEndpoint ${tepname}. There are no RouteRules that reference this TargetEndpoint.`,
            line: 0,
          });
        });
      } catch (e) {
        console.log("exception in BN012: " + e);
      }
    }
  }
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle,
};
