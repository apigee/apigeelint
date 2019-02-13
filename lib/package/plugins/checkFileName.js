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

//checkFileName.js

var plugin = {
  ruleId: "PO008",
  name: "Check File and Display Naming",
  message: "Check that file names correspond to policy display names.",
  fatal: false,
  severity: 1, //warning
  nodeType: "Policy",
  enabled: true
};

var onPolicy = function(policy, cb) {
  var fname = policy.getFileName().split(".xml")[0],
    hadWarn = false;

  if (fname !== policy.getDisplayName()) {
    policy.addMessage({
      plugin,
      message:
        'Filename "' +
        policy.fileName +
        '" does not match policy display name "' +
        policy.getDisplayName() +
        '". To avoid confusion when working online and offline use the same name for files and display name in policies (excluding .xml extension).'
    });
    hadWarn = true;
  }
  if (typeof(cb) == 'function') {
    cb(null, hadWarn);
  }
};

module.exports = {
  plugin,
  onPolicy
};
