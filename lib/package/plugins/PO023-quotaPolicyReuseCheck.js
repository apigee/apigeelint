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

//| &nbsp; |:white_medium_square:| PO023 | Quota Policy Reuse | When the same Quota policy is used more than once you must ensure that the conditions of execution are mutually exclusive or that you intend for a call to count more than once per message processed. |

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Quota Policy Reuse",
        message:
        "When the same Quota policy is used more than once you must ensure that the conditions of execution are mutually exclusive or that you intend for a call to count more than once per message processed.",
        fatal: false,
        severity: 2, //error
        nodeType: "Quota",
        enabled: true
      };


const onPolicy = function(policy,cb) {
  let hadWarning = false;
  if (policy.getType() === "Quota") {
    let attachedCount = policy.getSteps().length;

    if (attachedCount > 1) {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message:
          "Quota policy is enabled more than once (" + attachedCount + ")."
      });
    }
  }
  if (typeof(cb) == 'function') {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
