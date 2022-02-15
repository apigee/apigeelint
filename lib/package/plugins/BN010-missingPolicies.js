/*
  Copyright 2019-2022 Google LLC

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
        name: "Missing policies",
        message: "Missing policies will prevent bundle import.",
        fatal: false,
        severity: 2, //1 == warn 2 == error
        nodeType: "Bundle",
        enabled: true
      };

let thisBundle = null;
const onBundle = function(bundle, cb) {
        thisBundle = bundle;
        if (typeof(cb) == 'function') {
          cb(null, false);
        }
      };

const onStep =
  function(step, cb) {
    const source = step.getSource(),
          stepName = step.getName();
    let flagged = false,
        found = thisBundle.getPolicies().find( policy => policy.getName() == stepName);
    if (! found) {
      let element = step.getElement(),
          line = element.lineNumber,
          column = element.columnNumber;
      step.addMessage({ source, line, column, plugin, message: `Missing policy "${stepName}"`});
      flagged = true;
    }
    if (typeof(cb) == 'function') {
      cb(null, flagged);
    }
  };

module.exports = {
  plugin,
  onBundle,
  onStep
};
