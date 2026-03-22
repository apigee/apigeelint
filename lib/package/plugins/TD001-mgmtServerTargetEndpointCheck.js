/*
  Copyright © 2019-2020,2026 Google LLC

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

const xpath = require("xpath"),
  regexp = "(/v1/organizations/|enterprise.apigee.com)",
  ruleId = require("../lintUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "Discourage accessing management server from a proxy.",
  message: "Management server is intended for administrative tasks.",
  fatal: false,
  severity: 2, // 2=error
  nodeType: "TargetEndpoint",
  enabled: true,
};

const onTargetEndpoint = function (target, cb) {
  const url = xpath.select(
    "/TargetEndpoint/HTTPTargetConnection/URL/text()",
    target.getElement(),
  );
  let flagged = false;

  if (url && url[0] && url[0].data.match(regexp)) {
    const name = target.getName();
    target.addMessage({
      plugin,
      line: url[0].lineNumber,
      column: url[0].columnNumber,
      message: `TargetEndpoint (${name}) appears to be connecting to Management Server.`,
    });
    flagged = true;
  }
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onTargetEndpoint,
};
