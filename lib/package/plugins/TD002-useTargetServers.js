/*
  Copyright 2019,2024 Google LLC

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

//useTargetServers
//| &nbsp; |:white_medium_square:| TD002 | Use Target Server |  Discourage use of direct URLs in Target Server. |

const xpath = require("xpath"),
  ruleId = require("../myUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

var plugin = {
  ruleId,
  name: "Discourage use of direct URLs in Target Server.",
  message: "Using a Target Server simplifies CI/CD.",
  fatal: false,
  severity: 1, //warn
  nodeType: "TargetEndpoint",
  enabled: true
};

const onTargetEndpoint = function (target, cb) {
  debug("onTargetEndpoint parentName: " + target.getParent().getName());
  let flagged = false;
  let emg = false;
  if (target.getParent().getName().startsWith("edgemicro_")) {
    emg = true;
  }

  debug("onTargetEndpoint emg: " + emg);
  if (!emg) {
    const urlElement = xpath.select(
      "/TargetEndpoint/HTTPTargetConnection/URL",
      target.getElement()
    );
    if (urlElement && urlElement[0]) {
      const urlText = xpath.select(
        "/TargetEndpoint/HTTPTargetConnection/URL/text()",
        target.getElement()
      );

      if (urlText && urlText[0] !== undefined) {
        const name = target.getName();
        target.addMessage({
          plugin,
          message: `TargetEndpoint (${name}) is using URL (${urlText[0]}), using a Target Server simplifies CI/CD.`,
          line: urlElement[0].lineNumber,
          column: urlElement[0].columnNumber
        });
        flagged = true;
      }
    }
  }

  if (typeof cb == "function") {
    cb(null, flagged);
  }
  return flagged;
};

module.exports = {
  plugin,
  onTargetEndpoint
};
