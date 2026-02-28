/*
Copyright © 2019-2024, 2026 Google LLC

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

const ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId),
  xpath = require("xpath"),
  util = require("util");

const plugin = {
  ruleId,
  name: "Check for element placement within SetOAuthV2Info",
  fatal: false,
  severity: 2, // error
  nodeType: "Policy",
  enabled: true,
};

const allowedChildren = {
  DisplayName: [],
  AccessToken: [],
  Attributes: ["Attribute"],
  IgnoreUnresolvedVariables: [],
};

const _addIssue = (policy, message, line, column) => {
  const result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    nodeType: plugin.nodeType,
    message,
    line,
    column,
  };
  // discard duplicates
  if (
    !line ||
    !column ||
    !policy.report.messages.find((m) => m.line == line && m.column == column)
  ) {
    policy.addMessage(result);
  }
};

const onPolicy = function (policy, cb) {
  let foundIssue = false;

  if (policy.getType() === "SetOAuthV2Info") {
    try {
      debug(`policy ${policy.filePath}...`);
      const policyRoot = policy.getElement();
      debug(`root ${policyRoot}...`);
      const allowedTopLevelElements = Object.keys(allowedChildren);

      // check for unknown/unsupported elements at the top level
      const foundTopLevelChildren = xpath.select(
        "/SetOAuthv2Info/*",
        policyRoot,
      );
      debug(`found ${foundTopLevelChildren.length} toplevel children...`);
      foundTopLevelChildren.forEach((child) => {
        debug(`toplevel child: ${child.tagName}...`);
        if (!allowedTopLevelElements.includes(child.tagName)) {
          foundIssue = true;
          _addIssue(
            policy,
            `element <${child.tagName}> is not allowed here.`,
            child.lineNumber,
            child.columnNumber,
          );
        }
      });

      // For 1st level children, there should be at most one of each
      allowedTopLevelElements.forEach((elementName) => {
        const elements = xpath.select(`GenerateJWT/${elementName}`, policyRoot);
        if (elements.length != 0 && elements.length != 1) {
          foundIssue = true;
          elements
            .slice(1)
            .forEach((element) =>
              _addIssue(
                policy,
                `extra <${elementName}> element.`,
                element.lineNumber,
                element.columnNumber,
              ),
            );
        }
      });

      // check for exactly one of each required element
      ["AccessToken", "Attributes"].forEach((nameOfRequiredElement) => {
        const elementInstances = xpath.select(
          `/SetOAuthV2Info/${nameOfRequiredElement}`,
          policyRoot,
        );
        if (elementInstances.length == 0) {
          foundIssue = true;
          _addIssue(
            policy,
            `You must specify the ${nameOfRequiredElement} element.`,
            1,
            0,
          );
        } else if (elementInstances.length != 1) {
          foundIssue = true;
          elementInstances
            .slice(1)
            .forEach((element) =>
              _addIssue(
                policy,
                `Inappropriate <${element.tagName}> element; You must specify exactly one ${nameOfRequiredElement} element.`,
                element.lineNumber,
                element.columnNumber,
              ),
            );
        }
      });

      const accessTokenElements = xpath.select(
        "/SetOAuthV2Info/AccessToken",
        policyRoot,
      );

      if (accessTokenElements.length > 0) {
        // check for attributes - only ref is supported
        const accessTokenAttributes = xpath.select(
          "/SetOAuthV2Info/AccessToken[1]/@*",
          policyRoot,
        );
        accessTokenAttributes.forEach((attr) => {
          if (attr.name != "ref") {
            foundIssue = true;
            _addIssue(
              policy,
              `Inappropriate ${attr.name} attribute; only ref is supported here.`,
              accessTokenElements[0].lineNumber,
              accessTokenElements[0].columnNumber,
            );
          }
        });
      }

      const attributesElements = xpath.select(
        "/SetOAuthV2Info/Attributes",
        policyRoot,
      );
      if (attributesElements.length > 0) {
        const childElements = xpath.select("*", attributesElements[0]);
        let attributeChildElementCount = 0;
        childElements.forEach((child) => {
          if (child.tagName != "Attribute") {
            foundIssue = true;
            _addIssue(
              policy,
              `Inappropriate <${child.tagName}> element; only Attribute is supported here.`,
              child.lineNumber,
              child.columnNumber,
            );
          } else {
            attributeChildElementCount++;
            // look for required (name) and supported (ref) attributes
            const childAttributes = xpath.select("@*", child);
            const supportedAttrs = { name: 0, ref: 0 };
            childAttributes.forEach((attr) => {
              if (!Object.keys(supportedAttrs).includes(attr.name)) {
                foundIssue = true;
                _addIssue(
                  policy,
                  `Inappropriate ${attr.name} attribute; only ref or name supported here.`,
                  child.lineNumber,
                  child.columnNumber,
                );
              } else {
                supportedAttrs[attr.name]++;
                if (supportedAttrs[attr.name] > 1) {
                  foundIssue = true;
                  _addIssue(
                    policy,
                    `Inappropriate duplicate ${attr.name} attribute; use only one.`,
                    child.lineNumber,
                    child.columnNumber,
                  );
                }
                if (!attr.value) {
                  foundIssue = true;
                  _addIssue(
                    policy,
                    `Empty value for ${attr.name} attribute.`,
                    child.lineNumber,
                    child.columnNumber,
                  );
                }
              }
            });

            if (supportedAttrs.name == 0) {
              foundIssue = true;
              _addIssue(
                policy,
                `Missing name attribute.`,
                child.lineNumber,
                child.columnNumber,
              );
            }

            const childElementsOfAttribute = xpath.select("*", child);
            if (childElementsOfAttribute.length > 0) {
              childElementsOfAttribute.forEach((child) => {
                foundIssue = true;
                _addIssue(
                  policy,
                  `Unsupported <${child.tagName}> element.`,
                  child.lineNumber,
                  child.columnNumber,
                );
              });
            }
          }
        });

        if (attributeChildElementCount < 1) {
          foundIssue = true;
          _addIssue(
            policy,
            `There should be at least one <Attribute> element beneath <Attributes>.`,
            attributesElements[0].lineNumber,
            attributesElements[0].columnNumber,
          );
        }
      }

      // future: add other checks here.
    } catch (e) {
      console.log(e);
    }
  }

  if (typeof cb == "function") {
    cb(null, foundIssue);
  }
};

module.exports = {
  plugin,
  onPolicy,
};
