/*
  Copyright © 2026 Google LLC

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
  ruleId = lintUtil.getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check ServiceCallout SSLInfo usage",
  message: "There should be only valid child elements of SSLInfo",
  fatal: false,
  severity: 2, //2=error
  nodeType: "Policy",
  enabled: true,
};

const sslInfoCheck = require("./_sslInfoCheck.js");

const onPolicy = function (policy, cb) {
  let flagged = false;
  if (policy.getType() === "ServiceCallout") {
    debug(`found policy ${policy.getName()}`);
    const sslinfo = xpath.select(
      "/ServiceCallout/HTTPTargetConnection/SSLInfo",
      policy.getElement(),
    );

    if (sslinfo.length > 0) {
      const flag = (message, child) => {
        flagged = true;
        policy.addMessage({
          plugin,
          message,
          line: child.lineNumber,
          column: child.columnNumber,
        });
      };
      sslInfoCheck.check(sslinfo[0], flag);
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
