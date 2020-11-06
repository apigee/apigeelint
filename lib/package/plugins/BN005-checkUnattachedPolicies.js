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

//checkUnattachedPolicies.js

const plugin = {
        ruleId : require("../myUtil.js").getRuleId(),
        name: "Check for unattached policies",
        message:
        "Unattached policies are dead code. They should be removed from bundles before releasing the bundle to produciton.",
        fatal: false,
        severity: 1, //warn
        nodeType: "Policy",
        enabled: true
      };

let hadWarnErr = false;

const onPolicy = function(policy, cb) {
  if (!policy.getSteps() || policy.getSteps().length == 0) {
    policy.addMessage({
      plugin,
      message:
        policy.getName() +
        " is not attached to a Step in the bundle.  Remove unused policies."
    });
      hadWarnErr=true;
  }

  if (typeof cb == "function") {
    cb(null,hadWarnErr);
  }
};

module.exports = {
  plugin,
  onPolicy
};
