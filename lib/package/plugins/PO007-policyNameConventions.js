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
    name: "Policy Naming Conventions - type indication",
    message:
      "It is recommended that the policy name include an indicator of the policy type.",
    fatal: false,
    severity: 1, //warning
    nodeType: "Policy",
    enabled: true,
  },
  debug = require("debug")("apigeelint:" + ruleId),
  policyMetaData = require("./policyMetaData.json");

function partition(array, predicate) {
  return array.reduce(
    (acc, item) =>
      predicate(item) ? (acc[0].push(item), acc) : (acc[1].push(item), acc),
    [[], []],
  );
}

const onPolicy = function (policy, cb) {
  const policyName = policy.getName(),
    policyType = policy.getType(),
    pmd = policyMetaData[policyType],
    indications = (pmd && pmd.indications) || [];
  let flagged = false;

  if (!policyName) {
    policy.addMessage({
      plugin,
      message: `No name found for policy`,
    });
    flagged = true;
  } else if (indications && indications.length) {
    debug(`policyName(${policyName})`);
    const [patterns, prefixes] = partition(indications, (pf) =>
      pf.startsWith("^"),
    );
    let foundMatch = false;
    if (patterns && patterns.length) {
      const pn = policyName.toLowerCase();
      if (patterns.find((p) => new RegExp(p).exec(pn))) {
        foundMatch = true;
      }
    }
    if (!foundMatch) {
      const match = new RegExp("^([A-Za-z0-9]{1,})[-.](.+)$").exec(policyName),
        policyPrefix = match && match[1];
      debug(`prefix(${policyPrefix})`);
      if (
        policyPrefix &&
        prefixes.find((prefix) => policyPrefix.toLowerCase() == prefix)
      ) {
        foundMatch = true;
      }
    }
    if (!foundMatch) {
      const nameAttr = policy.select("//@name");
      debug(`name ${nameAttr[0]}`);
      let message =
        `Non-standard name for policy (${policyName}). Valid prefixes for the ${policyType} policy: ` +
        JSON.stringify(prefixes);
      if (patterns && patterns.length) {
        message += `. Valid patterns: ` + JSON.stringify(patterns) + ".";
      }
      policy.addMessage({
        plugin,
        line: nameAttr[0].lineNumber,
        column: nameAttr[0].columnNumber,
        message,
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
