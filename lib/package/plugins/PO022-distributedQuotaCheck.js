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

//distributedQuotaCheck

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId),
      xpath = require("xpath");

const plugin = {
    ruleId,
    name: "Nondistributed Quota",
    message:
      "When using nondistributed quota the number of allowed calls is influenced by the number of Message Processors (MPs) deployed. This may lead to higher than expected transactions for a given quota as MPs autoscale.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Quota",
    enabled: true
      };

const onPolicy = function(policy, cb) {
  let hadWarning = false;
  if (policy.getType() === "Quota") {
    let distQuotaValue = xpath.select(
      "/Quota/Distributed/text()",
      policy.getElement()
    );

    if (
      distQuotaValue.length == 0 ||
      distQuotaValue[0].data.toUpperCase() !== "TRUE"
    ) {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message: "Distributed quota is not enabled."
      });
    }
  }
  if (cb) {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
