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

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId),
      xpath = require("xpath");

const plugin = {
  ruleId,
  name: "Empty Steps",
  message: "Empty steps clutter a bundle. Performance is not degraded.",
  fatal: false,
  severity: 1, // 1 == warning, 2 == error
  nodeType: "Step",
  enabled: true
};

const onStep = function(step, cb) {
        let flagged = false;
        const source = step.getSource(),
              element = step.getElement(),
              line = element.lineNumber,
              column = element.columnNumber,
              addMessage = (message) => {
                step.addMessage({ source, line, column, plugin, message });
                flagged = true;
              };

        let nameChildren = xpath.select("Name", element);
        debug(`step(${line},${column}): nameChildren: ` + nameChildren.length);
        // check that there is at least one Name child element under Step
        if ( nameChildren.length == 0) {
          addMessage("Missing Name element for Step");
        }
        // check that the name is non-empty
        else if (step.getName() === "") {
          addMessage("Step name is empty.");
        }
        if (typeof cb == "function") {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onStep
};
