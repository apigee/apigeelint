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

const ruleId = require("../myUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "Check File and Policy Name attribute",
  message: "Check that file names correspond to policy name attribute.",
  fatal: false,
  severity: 2, //error
  nodeType: "Policy",
  enabled: true
};

const onPolicy = function(policy, cb) {
        let shortFilename = policy.getFileName().split(".xml")[0],
            nameFromAttribute = policy.getName(),
            flagged = false;

        if (shortFilename !== nameFromAttribute) {
          let nameAttr = policy.select('//@name');
          policy.addMessage({
            plugin,
            line: nameAttr[0].lineNumber,
            column: nameAttr[0].columnNumber,
            message: `Filename "${policy.fileName}" does not match policy name "${nameFromAttribute}".`
          });
          flagged = true;
        }
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onPolicy
};
