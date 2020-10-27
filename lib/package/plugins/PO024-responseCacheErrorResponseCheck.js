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
const xpath = require("xpath"),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Cache Error Responses",
        message:
        "By default the ResponseCache policy will cache non 200 responses. Either create a condition or use policy configuration options to exclude non 200 responses.",
        fatal: false,
        severity: 2, //error
        nodeType: "ResponseCache",
        enabled: true
      };

const onPolicy = function(policy, cb) {
  let hadWarning = false;
  if (policy.getType() === "ResponseCache") {
    var exclErr = xpath.select(
      "/ResponseCache/ExcludeErrorResponse/text()",
      policy.getElement()
    );

    if (exclErr.length == 0 || exclErr[0].data.toUpperCase() !== "TRUE") {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message: "ExcludeErrorResponse is not enabled."
      });
    }
  }
  if (typeof(cb) == 'function') {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
