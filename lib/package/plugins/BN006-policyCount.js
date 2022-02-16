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

const ruleId = require("../myUtil.js").getRuleId();
      // debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Check number of policies present in the bundle",
        message:
        "Large bundles can be problematic in development and difficult to maintain.",
        fatal: false,
        severity: 1, //warn
        nodeType: "Bundle",
        enabled: true
      };

const POLICY_COUNT_LIMIT = 100;

const onBundle = function(bundle, cb) {
  let flagged = false;

  if (bundle.policies && bundle.policies.length > POLICY_COUNT_LIMIT) {
    bundle.addMessage({
      plugin,
      message:
        `Policy count (${bundle.policies.length}) exceeds recommended limit of ${POLICY_COUNT_LIMIT}. ` +
        `Consider refactoring into two or more bundles. Large bundles take longer to deploy and are more difficult to debug and maintain.`
    });
    flagged = true;
  }
  if (typeof(cb) == 'function') {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle
};
