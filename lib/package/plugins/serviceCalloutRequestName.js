/*
  Copyright 2019 Google LLC

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

var plugin = {
    ruleId: "PO019",
    name: "Check ServiceCallout for Request variable name",
    message:
      "Using request for the Request name causes unexepcted side effects.",
    fatal: false,
    severity: 2, //error
    nodeType: "Policy",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.ruleId),
  myUtil = require("../myUtil.js");

var onPolicy = function(policy, cb) {
  var hadWarning = false;
  if (
    policy.getType() === "ServiceCallout" &&
    myUtil.selectAttributeValue(policy, "/ServiceCallout/Request/@variable") ===
      "request"
  ) {
    hadWarning = true;
    policy.addMessage({
      plugin,
      message:
        'Policy has a Request variable named "request", this may lead to unexpected side effects. Rename the Request variable.'
    });
  }
  if (typeof(cb) == 'function') {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
