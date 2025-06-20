/*
  Copyright 2019-2023,2025 Google LLC

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

const lintUtil = require("../lintUtil.js"),
  xpath = require("xpath"),
  jsonpath = require("jsonpath"),
  ruleId = lintUtil.getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check KeyValueMapOperations ExclusiveCache usage",
  fatal: false,
  severity: 1, //1= warning, 2=error
  nodeType: "Policy",
  enabled: true,
};

let bundleProfile = "apigee";
const onBundle = function (bundle, cb) {
  if (bundle.profile) {
    bundleProfile = bundle.profile;
  }
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const onPolicy = function (policy, cb) {
  let flagged = false;

  const addMessage = (line, column, message) => {
    policy.addMessage({ plugin, message, line, column });
    flagged = true;
  };
  try {
    if (policy.getType() === "KeyValueMapOperations") {
      let selection = policy.select(`/KeyValueMapOperations/ExclusiveCache`);
      if (selection && selection[0]) {
        selection.forEach((node) =>
          addMessage(
            node.lineNumber,
            node.columnNumber,
            "ExclusiveCache is deprecated in the KeyValueMapOperations policy",
          ),
        );
      }
      selection = policy.select(`/KeyValueMapOperations/Scope`);
      if (!selection || !selection[0]) {
        addMessage(
          1,
          1,
          "Scope element is missing in the KeyValueMapOperations policy",
        );
      } else if (selection || selection.length > 1) {
        selection
          .slice(1)
          .forEach((node) =>
            addMessage(
              node.lineNumber,
              node.columnNumber,
              "use at most one Scope element in the KeyValueMapOperations policy",
            ),
          );
      }
    }
  } catch (e) {
    debug(util.format(e));
  }

  if (typeof cb == "function") {
    cb(null, flagged);
  }
  return flagged;
};

module.exports = {
  plugin,
  onPolicy,
  onBundle,
};
