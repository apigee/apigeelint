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

//extractJSONConditionCheck
//| &nbsp; |:white_medium_square:| PO003 | Extract Variables with JSONPayload |  A check for a body element must be performed before policy execution. |

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Extract Variables with JSONPayload",
        message:
        "A check for a body element must be performed before policy execution.",
        fatal: false,
        severity: 2, //error
        nodeType: "ExtractVariables",
        enabled: true
      };

const checker = require('./_extractVariablesCheck.js').check;

module.exports = {
  plugin,
  onPolicy : checker(plugin, 'JSONPayload', debug)
};
