/*
  Copyright 2019-2020,2024 Google LLC

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

const lintUtil = require("../lintUtil.js"),
  xpath = require("xpath"),
  ruleId = lintUtil.getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check MessageLogging / CloudLogging hygiene",
  message:
    "In the MessageLogging policy, the CloudLogging element should use correct hygiene.",
  fatal: false,
  severity: 1, // 1=warning, 2=error
  nodeType: "Policy",
  enabled: true,
};

const onPolicy = function (policy, cb) {
  let hadWarning = false;
  if (policy.getType() === "MessageLogging") {
    debug(`found policy ${policy.getName()}`);
    const clElements = xpath.select(
      "/MessageLogging/CloudLogging",
      policy.getElement(),
    );
    try {
      if (clElements && clElements[0]) {
        debug(`found ${clElements.length} response element(s)`);
        if (clElements[1]) {
          hadWarning = true;
          policy.addMessage({
            plugin,
            message: "Policy has more than one CloudLogging element.",
            severity: 2, // 1=warning, 2=error
            line: clElements[1].lineNumber,
            column: clElements[1].columnNumber,
          });
        }

        // now check the zeroth element
        const requiredChildren = ["LogName", "Message"];
        const optionalChildren = ["Labels", "ResourceType"];
        const validChildren = requiredChildren.concat(optionalChildren);
        let found = {};

        const children = xpath.select(`*`, clElements[0]);
        children.forEach((child) => {
          if (validChildren.includes(child.tagName)) {
            if (found[child.tagName]) {
              policy.addMessage({
                plugin,
                message: `Found more than one CloudLogging/${child.tagName} element.`,
                severity: 2, // 1=warning, 2=error
                line: child.lineNumber,
                column: child.columnNumber,
              });
            } else {
              found[child.tagName] = 1;
            }
          } else {
            policy.addMessage({
              plugin,
              message: `Found more than one CloudLogging/${child.tagName} element.`,
              severity: 2, // 1=warning, 2=error
              line: child.lineNumber,
              column: child.columnNumber,
            });
          }
        });

        requiredChildren.forEach((requiredElementName) => {
          if (!found[requiredElementName]) {
            hadWarning = true;
            policy.addMessage({
              plugin,
              message: `Policy is missing a required Element: CloudLogging/${requiredElementName} element.`,
              severity: 2, // 1=warning, 2=error
              line: clElements[0].lineNumber,
              column: clElements[0].columnNumber,
            });
          }
        });

        if (found.ResourceType) {
          const rtypeElt = xpath.select(`ResourceType`, clElements[0])[0];
          const textValue =
            rtypeElt.childNodes &&
            rtypeElt.childNodes[0] &&
            rtypeElt.childNodes[0].nodeValue;
          debug(`rtypeElt textValue '${textValue}'`);
          if (!textValue || !textValue.trim()) {
            hadWarning = true;
            policy.addMessage({
              plugin,
              message: `ResourceType element is present but empty. Remove it or specify 'api'.`,
              severity: 1, // 1=warning, 2=error
              line: rtypeElt.lineNumber,
              column: rtypeElt.columnNumber,
            });
          } else if (textValue != "api") {
            hadWarning = true;
            policy.addMessage({
              plugin,
              message: `The value '${textValue}' should not be used here. ResourceType should be 'api'`,
              severity: 1, // 1=warning, 2=error
              line: rtypeElt.lineNumber,
              column: rtypeElt.columnNumber,
            });
          }
        }

        if (found.Labels) {
          // do some checks here
          const labelsElt = xpath.select(`Labels`, clElements[0])[0];
          // the only allowed child of Labels is Label, and that should have just Key + Value
          const labelsChildren = xpath.select(`*`, labelsElt);
          labelsChildren.forEach((labelsChild) => {
            if (labelsChild.tagName != "Label") {
              hadWarning = true;
              policy.addMessage({
                plugin,
                message: `Unsupported element '${labelsChild.tagName}'`,
                severity: 2, // 1=warning, 2=error
                line: labelsChild.lineNumber,
                column: labelsChild.columnNumber,
              });
            } else {
              // check each child
              const validLabelChildren = ["Key", "Value"];
              let found = {};
              xpath.select(`*`, labelsChild).forEach((labelChild) => {
                if (!validLabelChildren.includes(labelChild.tagName)) {
                  hadWarning = true;
                  policy.addMessage({
                    plugin,
                    message: `Unsupported element '${labelChild.tagName}'`,
                    severity: 2, // 1=warning, 2=error
                    line: labelChild.lineNumber,
                    column: labelChild.columnNumber,
                  });
                } else {
                  if (found[labelChild.tagName]) {
                    policy.addMessage({
                      plugin,
                      message: `Found more than one CloudLogging/${labelChild.tagName} element.`,
                      severity: 2, // 1=warning, 2=error
                      line: labelChild.lineNumber,
                      column: labelChild.columnNumber,
                    });
                  } else {
                    found[labelChild.tagName] = 1;
                  }
                }
              });
              validLabelChildren.forEach((requiredElementName) => {
                if (!found[requiredElementName]) {
                  hadWarning = true;
                  policy.addMessage({
                    plugin,
                    message: `Label is missing a required Element: ${requiredElementName}.`,
                    severity: 2, // 1=warning, 2=error
                    line: labelsChild.lineNumber,
                    column: labelsChild.columnNumber,
                  });
                }
              });
            }
          });
        }
      }
    } catch (e1) {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message:
          "Exception while examining CloudLogging element: " + e1.message,
      });
    }
  }
  if (typeof cb == "function") {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy,
};
