/*
  Copyright 2019-2023 Google LLC

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

const myUtil = require("../myUtil.js"),
  xpath = require("xpath"),
  //util = require("util"),
  ruleId = myUtil.getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check for use of Authentication element in ServiceCallout, ExternalCallout and TargetEndpoint",
  fatal: false,
  severity: 2, //1= warning, 2=error
  nodeType: "Feature",
  enabled: true
};

const policiesToCheck = {
  ServiceCallout: {
    path: `/ServiceCallout/HTTPTargetConnection/Authentication`,
    validChildren: ["HeaderName", "GoogleIDToken", "GoogleAccessToken"]
  },
  ExternalCallout: {
    path: `/ExternalCallout/GrpcConnection/Authentication`,
    validChildren: ["HeaderName", "GoogleIDToken"]
  }
};

let bundleProfile = "apigee";
const onBundle = function (bundle, cb) {
  if (bundle.profile) {
    bundleProfile = bundle.profile;
  }
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const checkAuthElements = function (
  selection,
  addMessage,
  label,
  validChildren
) {
  if (selection.length > 1) {
    addMessage(
      selection[1].lineNumber,
      selection[1].columnNumber,
      `${label} has multiple Authentication elements. You should have a maximum of one.`
    );
  }
  const authNode = selection[0];
  const children = xpath.select("*", authNode);
  if (children.length == 0) {
    addMessage(
      authNode.lineNumber,
      authNode.columnNumber,
      `misconfigured (empty) Authentication element.`
    );
  } else {
    children.forEach((child) => {
      if (!validChildren.includes(child.nodeName)) {
        addMessage(
          child.lineNumber,
          child.columnNumber,
          `Authentication element has unsupported child (${child.nodeName}).`
        );
      }
    });

    const tokenNodes = children
      .filter((child) => validChildren.includes(child.nodeName))
      .filter((child) => child.nodeName.endsWith("Token"));
    if (tokenNodes.length == 0) {
      const possibleElements = validChildren.filter((c) => c != "HeaderName");
      const message =
        possibleElements.length == 1
          ? `Authentication element needs a child ${possibleElements[0]}`
          : `Authentication element needs a child, one of [${possibleElements.join(
              ","
            )}]`;
      addMessage(authNode.lineNumber, authNode.columnNumber, message);
    } else if (tokenNodes.length > 1) {
      addMessage(
        tokenNodes[1].lineNumber,
        tokenNodes[1].columnNumber,
        `element ${tokenNodes[1].nodeName} is invalid here, because there is more than one *Token element.`
      );
    }
  }
};

const onPolicy = function (policy, cb) {
  let foundIssue = false;
  const policyType = policy.getType();
  const check = policiesToCheck[policyType];
  if (check) {
    const selection = policy.select(check.path);
    if (selection && selection[0]) {
      if (bundleProfile != "apigeex") {
        foundIssue = true;
        policy.addMessage({
          plugin,
          line: selection[0].lineNumber,
          column: selection[0].columnNumber,
          message: `Policy uses an Authentication element. Not supported in this profile.`
        });
      } else {
        const addMessage = (line, column, message) => {
          foundIssue = true;
          policy.addMessage({ plugin, line, column, message });
        };
        checkAuthElements(selection, addMessage, "Policy", check.validChildren);
      }
    }
  }
  if (typeof cb == "function") {
    cb(null, foundIssue);
  }
};

const onTargetEndpoint = function (endpoint, cb) {
  debug("onTargetEndpoint");
  let foundIssue = false;
  const httpTargets = xpath.select("HTTPTargetConnection", endpoint.element);
  if (httpTargets && httpTargets[0]) {
    debug("found HTTPTargetConnection");
    const authNodes = xpath.select("Authentication", httpTargets[0]);
    if (authNodes && authNodes[0]) {
      debug("found Authentication");
      if (bundleProfile != "apigeex") {
        foundIssue = true;
        endpoint.addMessage({
          plugin,
          line: authNodes[0].lineNumber,
          column: authNodes[0].columnNumber,
          message: `Endpoint uses an Authentication element. Not supported in this profile.`
        });
      } else {
        const addMessage = (line, column, message) => {
          foundIssue = true;
          endpoint.addMessage({ plugin, line, column, message });
        };
        checkAuthElements(authNodes, addMessage, "TargetEndpoint", [
          "GoogleIDToken",
          "GoogleAccessToken",
          "HeaderName"
        ]);
      }
    }
  }
  if (typeof cb == "function") {
    cb(null, foundIssue);
  }
  return foundIssue;
};

module.exports = {
  plugin,
  onBundle,
  onPolicy,
  onTargetEndpoint
};
