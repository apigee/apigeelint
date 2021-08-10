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

const ruleId = require("../myUtil.js").getRuleId();

const plugin = {
        ruleId,
        name: "Policy Availability in profile",
        message: "Some policies are available only in some profiles",
        fatal: false,
        severity: 1, //warning
        nodeType: "Policy",
        enabled: true
      },
      debug = require("debug")("apigeelint:" + ruleId),
      policyMetaData = require("./policyMetaData.js"),
      DEFAULT_PROFILES = ['apigee', 'apigeex'];

let bundleProfile = "apigee";
const onBundle = function(bundle, cb) {
  bundleProfile = bundle.profile;
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const onPolicy = function(policy, cb) {
        let policyName = policy.getName(),
            policyType = policy.getType(),
            pmd = policyMetaData[policyType],
            profiles = pmd.profiles || DEFAULT_PROFILES,
            flagged = false;

        if (policyName) {
          debug(`policyType(${policyType}) profile(${bundleProfile})`);
          debug(`${profiles}`);
          if (profiles.indexOf(bundleProfile)<0) {
            policy.addMessage({
              plugin,
              message:
              `The policy type (${policyType}) is not available in the profile ${bundleProfile}.`
            });
            flagged = true;
          }
        }

        if (typeof cb == "function") {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onBundle,
  onPolicy
};
