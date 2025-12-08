/*
  Copyright © 2019-2025 Google LLC

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
  xpath = require("xpath");

const plugin = {
  ruleId,
  name: "Check for element placement within SpikeArrest",
  fatal: false,
  severity: 2, // error
  nodeType: "Policy",
  enabled: true,
};

const allowedChildrenApigee = {
  DisplayName: [],
  Properties: [],
  Identifier: [],
  MessageWeight: [],
  Rate: [],
};

const additionalAllowedChildrenApigeex = {
  UseEffectiveCount: [],
};

let bundleProfile = "apigee";
const onBundle = function (bundle, cb) {
  if (bundle.profile) {
    bundleProfile = bundle.profile;
    debug(`profile ${bundleProfile}...`);
  }
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const determineAllowedChildren = (policyType) => {
  if (bundleProfile === "apigee") {
    return allowedChildrenApigee;
  }

  if (policyType === "SpikeArrest") {
    return { ...allowedChildrenApigee, ...additionalAllowedChildrenApigeex };
  }

  return {
    ...allowedChildrenApigee,
    ...additionalAllowedChildrenApigeex,
    UserPromptSource: [],
  };
};

const onPolicy = function (policy, cb) {
  let foundIssue = false;
  const addIssue = (message, line, column) => {
    const result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      nodeType: plugin.nodeType,
      message,
      line,
      column,
    };
    policy.addMessage(result);
    foundIssue = true;
  };

  if (
    policy.getType() === "SpikeArrest" ||
    policy.getType() === "PromptTokenLimit"
  ) {
    // Initialize the const by calling the function.
    const allowedChildren = determineAllowedChildren(policy.getType());
    try {
      debug(`policy(${policy.filePath}) profile(${bundleProfile})`);
      const policyRoot = policy.getElement();
      debug(`root ${policyRoot}...`);

      // 1. check for unknown/unsupported elements
      const foundTopLevelChildren = xpath.select("/*/*", policyRoot);
      foundTopLevelChildren.forEach((child) => {
        debug(`toplevel child: ${child.tagName}...`);
        if (!Object.keys(allowedChildren).includes(child.tagName)) {
          let addendum =
            bundleProfile == "apigee" &&
            Object.keys(additionalAllowedChildrenApigeex).includes(
              child.tagName,
            )
              ? " in profile=apigee"
              : "";
          let msg = `The element <${child.tagName}> is not allowed here${addendum}.`;
          addIssue(msg, child.lineNumber, child.columnNumber);
        }
      });

      // 2. For 1st level children, there should be at most one.
      Object.keys(allowedChildren).forEach((elementName) => {
        const elements = xpath.select(`/*/${elementName}`, policyRoot);
        if (elements.length != 0 && elements.length != 1) {
          elements
            .slice(1)
            .forEach((element) =>
              addIssue(
                `Extra <${elementName}> element.`,
                element.lineNumber,
                element.columnNumber,
              ),
            );
        }
      });

      // 3. There is just one required element: Rate
      ["Rate"].forEach((elementName) => {
        const elements = xpath.select(`/*/${elementName}`, policyRoot);
        if (elements.length == 0) {
          addIssue(`Missing <${elementName}> element.`);
        }
      });

      // 4. Some of the elements ought to be boolean only
      const booleanElements = ["IgnoreUnresolvedVariables"];
      if (bundleProfile == "apigeex") {
        booleanElements.push("UseEffectiveCount");
      }
      booleanElements.forEach((elementName) => {
        const element = xpath.select1(`${elementName}`, policyRoot);
        if (element) {
          let textValue = xpath.select1("text()", element);
          textValue = textValue && textValue.data.trim().toLowerCase();
          if (textValue && !["true", "false"].includes(textValue)) {
            addIssue(
              `The value for <${elementName}> should be one of [true,false].`,
              element.lineNumber,
              element.columnNumber,
            );
          }
        }
      });

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
  onBundle,
  onPolicy,
};
