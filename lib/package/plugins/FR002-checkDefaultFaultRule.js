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

const util = require('util'),
      xpath = require("xpath"),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "DefaultFaultRule Structure",
        message: "DefaultFaultRule should have only supported child elements, at most one AlwaysEnforce element, and at most one Condition element.",
        fatal: false,
        severity: 1, // 1 = warn, 2 = error
        nodeType: "Step",
        enabled: true
      };

const onDefaultFaultRule = (dfr, cb) => {
        let flagged = false;
        const source = dfr.getSource(),
              element = dfr.getElement(),
              line = element.lineNumber,
              column = element.columnNumber,
              addMessage = (message) => {
                dfr.addMessage({ source, line, column, plugin, message });
                flagged = true;
              };
        let allChildren = xpath.select("*", element);
        debug(`dfr(${line},${column}): child elements: ` + allChildren.length);
        allChildren.forEach( child => {
          debug(`dfr child(${child.nodeName})`);
          if (["AlwaysEnforce", "Step", "Condition"].indexOf(child.nodeName) == -1) {
            addMessage(`Unknown element (${child.nodeName}) under DefaultFaultRule`);
          }
        });
        let alwaysEnforceChildren = allChildren.filter(child => child.nodeName == 'AlwaysEnforce');
        if (alwaysEnforceChildren.length > 1) {
          addMessage(`Multiple AlwaysEnforce elements under DefaultFaultRule`);
        }
        let conditionChildren = allChildren.filter(child => child.nodeName == 'Condition');
        if (conditionChildren.length > 1) {
          addMessage(`Multiple Condition elements under DefaultFaultRule`);
        }
        if (typeof cb == "function") {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onDefaultFaultRule
};
