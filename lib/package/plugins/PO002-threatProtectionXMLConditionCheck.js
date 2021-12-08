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


//| &nbsp; |:white_medium_square:| PO002 | XML Threat Protection |  A check for a body element must be performed before policy execution. |

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
    ruleId,
    name: "XMLThreatProtection check for body",
    message:
      "A check for a body element must be performed before policy execution.",
    fatal: false,
    severity: 2, //error
    nodeType: "XMLThreatProtection",
    enabled: true
  },
  condRegExp =
    "(response.content|response.form|request.content|request.form|message.content|message.form|message.verb|request.verb)";

const checker = require('./_policyConditionCheck.js');

const onPolicy = checker(plugin, "XMLThreatProtection", condRegExp, debug);

module.exports = {
  plugin,
  onPolicy
};
