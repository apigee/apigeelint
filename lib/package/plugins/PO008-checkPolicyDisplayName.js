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
  name: "Check File and DisplayName",
  message: "Check that policy filename corresponds to policy DisplayName.",
  fatal: false,
  severity: 1, //warning
  nodeType: "Policy",
  enabled: true
};

const onPolicy = function(policy, cb) {
        let displayName = policy.getDisplayName(),
            flagged = false;
        if (displayName === '') {
          let element = policy.select("//DisplayName");
          policy.addMessage({
            plugin,
            line: element[0].lineNumber,
            column: element[0].columnNumber,
            message: `Empty DisplayName. Remove it or use a non-blank value.`
          });
          flagged = true;
        }
        else if (displayName) {
          let shortFilename = policy.getFileName().split(".xml")[0];
          if (shortFilename !== displayName) {
            let element = policy.select("//DisplayName");
            policy.addMessage({
              plugin,
              line: element[0].lineNumber,
              column: element[0].columnNumber,
              message:
              `Filename "${policy.fileName}" does not match policy display name "${displayName}". To avoid confusion when working online and offline use the same name for files and display name in policies (excluding .xml extension).`
            });
            flagged = true;
          }
        }

        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onPolicy
};
