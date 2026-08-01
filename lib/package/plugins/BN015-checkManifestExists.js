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

const ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Manifest file exists",
  message:
    "The bundle root must contain exactly one manifest .xml file (eg. apiproxy.xml or sharedflowbundle.xml). Without it the bundle cannot be imported into Apigee.",
  fatal: false,
  severity: 2, //1 == warn 2 == error
  nodeType: "Bundle",
  enabled: true,
};

const onBundle = function (bundle, cb) {
  let flagged = false;
  // Bundle.js sets bundle.filePath only when exactly one .xml file is
  // found at the bundle root. When the manifest is missing entirely,
  // filePath is left undefined.
  if (!bundle.filePath) {
    debug(`No manifest file found in bundle root: ${bundle.root}`);
    bundle.addMessage({
      plugin,
      message: `Missing manifest file: no .xml file found at bundle root "${bundle.root}".`,
    });
    flagged = true;
  }
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle,
};
