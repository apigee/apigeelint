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

//| &nbsp; |:white_medium_square:| ST006 | JSON Threat Protection |  A check for a body element must be performed before policy execution. |

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "JSONThreatProtection check for body",
        message: "A check for a body element must be performed before policy execution.",
        fatal: false,
        severity: 2, //error
        nodeType: 'Step',
        enabled: true
      };

const checkMaker = require('./_policyConditionCheck.js');

const check = checkMaker(plugin, "JSONThreatProtection", debug);

const onProxyEndpoint = function(endpoint, cb) {
        debug('onProxyEndpoint');
        let flagged = check(endpoint);
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const onTargetEndpoint = function(endpoint, cb) {
        debug('onTargetEndpoint');
        let flagged = check(endpoint);
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
