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

//| &nbsp; |:white_medium_square:| PO026 | AssignVariable Usage | With AssignVariable, check various usage issues. The Name element must be present. The Ref element, if any, should not be surrounded in curlies. |

const xpath = require("xpath"),
      util = require('util'),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "AssignVariableUsage",
        fatal: false,
        severity: 2, //error
        nodeType: "AssignMessage",
        enabled: true
      };

const onPolicy = function(policy, cb) {
      let flagged = false;
      const addMessage = (line, column, message) => {
              policy.addMessage({plugin, message, line, column});
              flagged = true;
            };
      if (policy.getType() === "AssignMessage") {
        const avNodes = xpath.select("/AssignMessage/AssignVariable", policy.getElement());
        if (avNodes && avNodes.length>0) {
          debug(`${policy.fileName} found ${avNodes.length} AssignVariable elements`);
          avNodes.forEach( (node, ix) => {
            const addNodeMessage = (message) =>
                    addMessage(node.lineNumber, node.columnNumber, message);

            const childNodes = xpath.select("*", node);
            if (childNodes.length == 0) {
              addNodeMessage("empty AssignVariable. Should have a Name child, and at least one of {Ref, Template, Value}.");
            }
            else {
              let found = { Name:0, Template:0, Value:0, Ref:0 };
              childNodes.forEach( (child, ix) => {
                debug(util.format(child));
                if (found.hasOwnProperty(child.tagName)) {
                  found[child.tagName]++;
                }
                else {
                  addMessage(child.lineNumber, child.columnNumber, `There is a stray element (${child.tagName})`);
                }
              });

              if (found.Name > 1) {
                addNodeMessage("There is more than one Name element");
              }
              else if ( found.Name == 0) {
                addNodeMessage("There is no Name element");
              }

              if (found.Ref > 1) {
                addNodeMessage("There is more than one Ref element");
              }
              else if (found.Ref == 1) {
                let textnode = xpath.select("Ref/text()", node),
                    refText = textnode[0].data;
                if (refText && refText.startsWith('{') && refText.endsWith('}')) {
                  addMessage(textnode[0].lineNumber, textnode[0].columnNumber, "The text of the Ref element must be a variable name, should not be wrapped in curlies.");
                }
              }

              if (found.Template > 1) {
                addNodeMessage("There is more than one Template element");
              }

              if (found.Value > 1) {
                addNodeMessage("There is more than one Value element");
              }

              // TODO: add ResourceURL to this list when the CL for b/155436526 is merged
              if (found.Value == 0 && found.Template == 0 && found.Ref == 0) {
                addNodeMessage("You should have at least one of: {Ref, Value, Template}");
              }

            }

          });
        }
        else {
          debug(`${policy.fileName} found no AssignVariable elements`);
        }
      }
      if (typeof(cb) == 'function') {
        cb(null, flagged);
      }
    };

module.exports = {
  plugin,
  onPolicy
};
