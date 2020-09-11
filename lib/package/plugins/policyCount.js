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

//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

var plugin = {
    ruleId: "BN006",
    name: "Check number of policies present in the bundle",
    message:
      "Large bundles can be problematic in development and difficult to maintain.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Bundle",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.ruleId);

var onBundle = function(bundle, cb) {
  var limit = 100,//for testing set to 100 on release
    warnErr = false;

  if (bundle.policies && bundle.policies.length > limit) {
    bundle.addMessage({
      plugin,
      message:
        "Bundle size (" +
        bundle.policies.length +
        ") exceeds recommended limit of " +
        limit +
        ". Consider refactoring into two or more bundles. Large bundle take longer to deploy and are more difficult to debug and maintain."
    });
    warnErr = true;
  }
  if (typeof(cb) == 'function') {
    cb(null, warnErr);
  }
};

//var checkBundle = function(bundle) {};

module.exports = {
  plugin,
  onBundle
};
