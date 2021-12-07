/*
  Copyright 2019-2020 Google LLC

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
        name: "ConcurrentRateLimit Policy Deprecation",
        message: "Check usage of deprecated policy ConcurrentRateLimit.",
        fatal: false,
        severity: 1, //warning
        nodeType: "Policy",
        enabled: true
      };

const onPolicy = function(policy, cb) {
        let flagged = false;
        if (policy.getType() === "ConcurrentRateLimit") {
          flagged = true;
          policy.addMessage({
            plugin,
            message:
            'ConcurrentRateLimit Policy is deprecated. Refer to online deprecation notice for details.'
          });
        }

        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onPolicy
};
