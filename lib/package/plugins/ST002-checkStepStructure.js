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
        name: "Step Structure",
        message: "Steps with doubled elements or unsupported elements are wrong.",
        fatal: false,
        severity: 2, // 1 = warn, 2 = error
        nodeType: "Step",
        enabled: true
      };

const onStep = (step, cb) => {
        let flagged = false;
        const source = step.getSource(),
              element = step.getElement(),
              line = element.lineNumber,
              column = element.columnNumber,
              addMessage = (message) => {
                step.addMessage({ source, line, column, plugin, message });
                flagged = true;
              };

        // if (count == 0)
        //   debug(`element:` + util.format(element));
        //count++;

        // // 1. FaultRules within Step (comes from UI)
        // let innerFaultRules = xpath.select("FaultRules", element);
        // if (innerFaultRules && innerFaultRules.length > 0) {
        //   addMessage("FaultRules within a Step are not supported.");
        // }

        let nameChildren = xpath.select("Name", element);
        debug(`step(${line},${column}): Name elements: ` + nameChildren.length);
        // check at most one Name child
        if (nameChildren.length > 1) {
          addMessage("Multiple Name elements for Step");
        }

        else if (nameChildren.length == 1) {
          // single Name element
          // check for child elements beneath
          let childElements = xpath.select("*", nameChildren[0]);
          if (childElements.length > 0) {
            addMessage("Stray element under Name element for Step");
            // check text value
            let textNodes = xpath.select("text()", nameChildren[0]);
            if (textNodes.length > 1) {
              addMessage("Name element should have a single Text child");
            }
            else if (textNodes.length == 1) {
              let embeddedStepName = textNodes[0].data;
              if (embeddedStepName != embeddedStepName.trim()) {
                addMessage("Name value should not have leading/trailing whitespace");
              }
            }
          }
        }

        let condChildren = xpath.select("Condition", element);
        // check at most one Condition child
        if (condChildren.length > 1) {
          addMessage("Multiple Condition elements for Step");
        }
        else if (condChildren.length == 1) {
          // single Condition element
          // check no child elements under Condition
          let childElements = xpath.select("*", condChildren[0]);
          if (childElements.length > 0) {
            addMessage("Stray element under Condition element for Step");
          }
        }

        let allChildren = xpath.select("*", element);
        debug(`step(${line},${column}): child elements: ` + allChildren.length);
        allChildren.forEach( child => {
          if (["Name", "Condition", "FaultRules"].indexOf(child.nodeName) == -1) {
            addMessage(`Stray element (${child.nodeName}) under Step`);
          }
        });

        if (typeof cb == "function") {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onStep
};
