/*
  Copyright 2019-2025 Google LLC

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
  util = require("util"),
  ruleId = require("../lintUtil.js").getRuleId(),
  pluginUtil = require("./_pluginUtil.js"),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "AssignVariableUsage",
  fatal: false,
  severity: 2, //error
  nodeType: "AssignMessage",
  enabled: true,
};

let profile = "apigee";
const onBundle = function (bundle, cb) {
  debug(`onBundle() ` + Error().stack);
  profile = bundle.profile;
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const onPolicy = function (policy, cb) {
  let flagged = false;
  const ptype = policy.getType();
  if (ptype === "AssignMessage" || ptype === "RaiseFault") {
    const addMessage = (line, column, message) => {
      policy.addMessage({ plugin, message, line, column });
      flagged = true;
    };
    const xpathExpr =
      ptype === "AssignMessage"
        ? "/AssignMessage/AssignVariable"
        : "/RaiseFault/FaultResponse/AssignVariable";
    const avNodes = xpath.select(xpathExpr, policy.getElement());
    if (avNodes && avNodes.length > 0) {
      debug(
        `${util.format(policy)} found ${avNodes.length} AssignVariable elements`,
      );
      avNodes.forEach((node, ix) => {
        const addNodeMessage = (message) =>
          addMessage(node.lineNumber, node.columnNumber, message);

        debug(`Configuration profile is: ${profile}`);
        let found = { Name: 0, Ref: 0, Value: 0, Template: 0 };
        if (profile === "apigeex") {
          found = { ...found, PropertySetRef: 0, ResourceURL: 0 };
        }

        // Get the keys after Name
        const foundKeysStr = Object.keys(found)
          .filter((k) => k != "Name")
          .join(",");

        const childNodes = xpath.select("*", node);
        if (childNodes.length == 0) {
          addNodeMessage(
            `empty AssignVariable. Should have a Name child, and at least one of {${foundKeysStr}}.`,
          );
        } else {
          childNodes.forEach((child, _ix) => {
            debug(
              `childNode ${ix}: type(${child.nodeType}) name(${child.nodeName})`,
            );
            if (typeof found[child.tagName] !== "undefined") {
              found[child.tagName]++;
            } else {
              addMessage(
                child.lineNumber,
                child.columnNumber,
                `There is a stray element (${child.tagName})`,
              );
            }
          });

          if (found.Name > 1) {
            addNodeMessage("There is more than one Name element");
          } else if (found.Name == 0) {
            addNodeMessage("There is no Name element");
          }

          if (found.Ref > 1) {
            addNodeMessage("There is more than one Ref element");
          } else if (found.Ref == 1) {
            const textnode = xpath.select("Ref/text()", node),
              refText = textnode[0] && textnode[0].data;
            if (refText && (refText.includes("{") || refText.includes("}"))) {
              addMessage(
                textnode[0].lineNumber,
                textnode[0].columnNumber,
                "The text of the Ref element must be a variable name, should not include curlies",
              );
            }
          }

          if (found.PropertySetRef > 1) {
            addNodeMessage("There is more than one PropertySetRef element");
          } else if (found.PropertySetRef == 1) {
            const textnode = xpath.select("PropertySetRef/text()", node),
              psrText = textnode[0] && textnode[0].data;
            if (!psrText) {
              addMessage(
                textnode[0].lineNumber,
                textnode[0].columnNumber,
                "The text of the PropertySetRef element must not be empty",
              );
            }
            let r = pluginUtil.validateTemplate(psrText);
            if (r) {
              addMessage(
                textnode[0].lineNumber,
                textnode[0].columnNumber,
                `The text of the PropertySetRef element must be a valid message template (${r})`,
              );
            } else {
              r = pluginUtil.validatePropertySetRef(psrText);
              if (r) {
                addMessage(
                  textnode[0].lineNumber,
                  textnode[0].columnNumber,
                  `Error in the text of the PropertySetRef element: ${r}`,
                );
              }
            }
          }

          if (found.Template > 1) {
            addNodeMessage("There is more than one Template element");
          } else if (found.Template == 1) {
            const textnode = xpath.select("Template/text()", node),
              templateText = textnode[0] && textnode[0].data;
            if (templateText) {
              const r = pluginUtil.validateTemplate(templateText);
              if (r) {
                addMessage(
                  textnode[0].lineNumber,
                  textnode[0].columnNumber,
                  "invalid template: " + util.format(r),
                );
              }
            }
          }

          if (found.Value > 1) {
            addNodeMessage("There is more than one Value element");
          }

          let foundAny = 0;
          let key;
          for (key in found) {
            if (found[key] && key != "Name") {
              foundAny += found[key];
            }
          }
          if (foundAny === 0) {
            addNodeMessage(
              `You should have at least one of: {${foundKeysStr}}`,
            );
          }
        }
      });
    } else {
      debug(`${policy.fileName} found no AssignVariable elements`);
    }
  }
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle,
  onPolicy,
};
