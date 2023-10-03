/*
  Copyright 2019-2023 Google LLC

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

const myUtil = require("../myUtil.js"),
  xpath = require("xpath"),
  ruleId = myUtil.getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check ExtractVariables hygiene",
  fatal: false,
  severity: 2, //1= warning, 2=error
  nodeType: "Policy",
  enabled: true
};

const ALLOWED_VAR_TYPES = [
  "boolean",
  "double",
  "float",
  "integer",
  "long",
  "nodeset",
  "string"
];

const onPolicy = function (policy, cb) {
  let foundIssue = false;
  if (policy.getType() === "ExtractVariables") {
    ["JSON", "XML"].forEach((datatype) => {
      const elementName = `${datatype}Payload`;
      let selection = policy.select(`/ExtractVariables/${elementName}`);
      if (selection && selection[0]) {
        if (selection.length > 1) {
          foundIssue = true;
          policy.addMessage({
            plugin,
            message: `Policy has multiple ${elementName} elements. You should have a maximum of one.`
          });
        }

        selection = policy.select(
          `/ExtractVariables/${elementName}[1]/Variable`
        );
        if (selection && selection.length) {
          selection.forEach((elt, _ix) => {
            const typeattr = xpath.select("@type", elt);
            if (
              typeattr &&
              typeattr[0] &&
              typeattr[0].value &&
              !ALLOWED_VAR_TYPES.includes(typeattr[0].value)
            ) {
              foundIssue = true;
              policy.addMessage({
                plugin,
                message:
                  `${elementName}/Variable/@type is (${typeattr[0].value}), must be one of ` +
                  ALLOWED_VAR_TYPES.toString()
              });
            }
          });
        } else {
          foundIssue = true;
          policy.addMessage({
            plugin,
            message: `${elementName} element exists but there is no Variable element.`
          });
        }
      }
    });
  }
  if (typeof cb == "function") {
    cb(null, foundIssue);
  }
};

module.exports = {
  plugin,
  onPolicy
};
