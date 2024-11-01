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

const ruleId = require("../lintUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "OAuth V1 Policies Deprecation",
        message: "Check usage of deprecated OAuth V1 policies.",
        fatal: false,
        severity: 1, //warning
        nodeType: "Policy",
        enabled: true
      };

const onPolicy = function(policy, cb) {
        let hadWarning = false;
        if (policy.getType() === "OAuthV1" ||
            policy.getType() === "GetOAuthV1Info" ||
            policy.getType() === "DeleteOAuthV1Info") {
          hadWarning = true;
          policy.addMessage({
            plugin,
            message:
            'OAuth V1 policies are deprecated. Refer to online deprecation notice for details.'
          });
        }

        if (typeof(cb) == 'function') {
          cb(null, hadWarning);
        }
      };

module.exports = {
  plugin,
  onPolicy
};
