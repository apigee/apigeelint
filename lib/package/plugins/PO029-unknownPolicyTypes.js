/*
  Copyright 2019-2021 Google LLC

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
        name: "Policy type is known",
        message: "That policy type is not recognized",
        fatal: false,
        severity: 2, //error
        nodeType: "Policy",
        enabled: true
      },
      debug = require("debug")("apigeelint:" + ruleId),
      policyMetaData = require("./policyMetaData.json");

const onPolicy = function(policy, cb) {
        let policyName = policy.getName();
        if (policyName) {
          let policyType = policy.getType(),
              pmd = policyMetaData[policyType],
              flagged = false;

          debug(`policyType(${policyType})`);
          if (!pmd) {
            policy.addMessage({
              plugin,
              message: `The policy type (${policyType}) is not recognized`
            });
            flagged = true;
          }

          if (typeof cb == "function") {
            cb(null, flagged);
          }
        }
      };

module.exports = {
  plugin,
  onPolicy
};
