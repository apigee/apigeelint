/*
  Copyright © 2019-2021,2026 Google LLC

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
    name: "Policy Availability in profile",
    message: "Some policies are available only in some profiles",
    fatal: false,
    severity: 2, //1=warning, 2=error
    nodeType: "Policy",
    enabled: true,
  },
  debug = require("debug")("apigeelint:" + ruleId),
  policyMetaData = require("./policyMetaData.json"),
  DEFAULT_PROFILES = ["apigee", "apigeex"];

const onPolicy = function (policy, cb) {
  const policyName = policy.getName(),
    policyType = policy.getType(),
    bundleProfile = policy.getBundle().profile,
    pmd = policyMetaData[policyType],
    profiles = pmd.profiles || DEFAULT_PROFILES;
  let flagged = false;

  if (policyName) {
    debug(`policyType(${policyType}) bundleProfile(${bundleProfile})`);
    debug(`policy profiles (${profiles})`);
    if (profiles.indexOf(bundleProfile) < 0) {
      policy.addMessage({
        plugin,
        message: `The policy type (${policyType}) is not available in the profile ${bundleProfile}.`,
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
  onPolicy,
};
