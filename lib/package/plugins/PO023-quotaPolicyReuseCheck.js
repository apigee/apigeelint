/*
  Copyright 2019-2020,2025 Google LLC

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
const lintUtil = require("../lintUtil.js");
const path = require("node:path");
const ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Quota Policy Reuse",
  message:
    "When the same Quota policy is used more than once you must ensure that the conditions of execution are mutually exclusive or that you intend for a call to count more than once per message processed.",
  fatal: false,
  severity: 2, //error
  nodeType: "Quota",
  enabled: true,
};

const onPolicy = function (policy, cb) {
  let hadWarning = false;
  if (policy.getType() === "Quota") {
    let attachedCount = policy.getSteps().length;
    var steps = policy.getSteps();
    if (steps) {
      const parentMap = {};
      const mapCount = {};
      for (const step of steps) {
        if (!lintUtil.isEmpty(step)) {
          const [u, key] = getFlowKey(step);
          if (!mapCount[key]) {
            mapCount[key] = 0;
            parentMap[key] = u;
          }
          mapCount[key] = mapCount[key] + 1;
        }
      }

      for (const key in mapCount) {
        if (mapCount[key] > 1) {
          let f = parentMap[key];
          hadWarning = true;
          policy.addMessage({
            plugin,
            message:
              `Quota policy '${f.name}' is enabled more than once (${mapCount[key]} times) with the condition ` +
              `'${f.condition}' in the ${f.phase} phase (${f.parentName})`,
          });
        }
      }
    }
  }
  if (typeof cb == "function") {
    cb(null, hadWarning);
  }
};

function getStepCondition(step) {
  try {
    let condition = step.getCondition();
    var expr = "";
    if (condition) return condition.getExpression();
  } catch (error) {
    console.log(error);
  }
  return "";
}

function getFlowKey(step) {
  const parent = step.getParent();
  const parentType = parent.constructor.name;
  const uniquifier = {
    name: step.getName(),
    parentType,
    condition: getStepCondition(step),
  };
  if (parentType == "FlowPhase") {
    uniquifier.phase = parent.getPhase();
    uniquifier.parentName = parent.getParent().getName();
    uniquifier.parentContainer = {
      type: parent.getParent().getType(),
      parent: parent.getParent().getParent().getType(),
      filename: lintUtil.getFileName(parent.getParent()),
    };
  } else {
    uniquifier.phase = parentType;
    uniquifier.parentName = parent.getName();
    uniquifier.parentContainer = {
      name: parent.getParent().getName(),
      type: parent.getParent().getType(),
    };
  }
  const s = JSON.stringify(uniquifier, null, 2);
  debug(`getFlowKey() s=${s}`);
  const v = lintUtil.cyrb53(JSON.stringify(uniquifier));
  debug(`getFlowKey() v=${v}`);
  return [uniquifier, v];
}

module.exports = {
  plugin,
  onPolicy,
};
