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
  name: "Check for element placement within GenerateJWT",
  fatal: false,
  severity: 2, // error
  nodeType: "Policy",
  enabled: true,
};

const allowedChildren = {
  DisplayName: [],
  Algorithm: [],
  Algorithms: ["Key", "Content"],
  IgnoreUnresolvedVariables: [],
  SecretKey: ["Value", "Id"],
  PrivateKey: ["Value", "Id", "Password"],
  PublicKey: ["Value", "Certificate", "JWKS", "Id"],
  PasswordKey: ["Value", "Id", "PBKDF2Iterations", "SaltLength"],
  Subject: [],
  Issuer: [],
  Audience: [],
  ExpiresIn: [],
  AdditionalClaims: ["Claim"],
  AdditionalHeaders: ["Claim"],
  OutputVariable: [],
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

  if (policy.getType() === "GenerateJWT") {
    try {
      debug(`policy ${policy.filePath}...`);
      const policyRoot = policy.getElement();
      debug(`root ${policyRoot}...`);
      const allowedTopLevelElements = Object.keys(allowedChildren).filter(
        (key) => !key.includes("/"),
      );

      // check for at least one of Algorithm or Algorithms, not both
      const algOrAlgs = xpath.select(
        "/GenerateJWT/*[name()='Algorithm' or name()='Algorithms']",
        policyRoot,
      );
      debug(`found ${algOrAlgs.length} algOrAlgs children...`);
      if (algOrAlgs.length == 0) {
        foundIssue = true;
        _addIssue(policy, `You must specify Algorithm or Algorithms.`, 1, 0);
      } else if (algOrAlgs.length != 1) {
        foundIssue = true;
        algOrAlgs
          .slice(1)
          .forEach((element) =>
            _addIssue(
              policy,
              `Inappropriate <${element.tagName}> element; You must specify exactly one of Algorithm or Algorithms.`,
              element.lineNumber,
              element.columnNumber,
            ),
          );
      }

      // check for unknown/unsupported elements at the top level
      const foundTopLevelChildren = xpath.select("/GenerateJWT/*", policyRoot);
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

      // check for key agreement with Algorithm
      if (algOrAlgs.length > 0) {
        debug(`check key and alg agreement...${algOrAlgs[0].tagName}`);
        let algText = xpath.select1("text()", algOrAlgs[0]);
        algText = algText && algText.data.trim();
        debug(`alg ...${algText}`);
        // example only the first element
        const keyElementNames = Object.keys(allowedChildren).filter((name) =>
          name.endsWith("Key"),
        );
        const keySelector = keyElementNames
          .map((n) => `name()='${n}'`)
          .join(" or ");
        debug(`keySelector: ${keySelector}`);
        const keyChildren = xpath.select(
          `/GenerateJWT/*[${keySelector}]`,
          policyRoot,
        );
        const flagMissingKey = (requiredKey) => {
          foundIssue = true;
          _addIssue(
            policy,
            `The policy must include a <${requiredKey}> when the algorithm is ${algText}.`,
            algOrAlgs[0].lineNumber,
            algOrAlgs[0].columnNumber,
          );
        };
        const flagWrongKeys = (wrongKeys, expectedTag) => {
          foundIssue = true;
          wrongKeys.forEach((wrongKey) =>
            _addIssue(
              policy,
              wrongKey.tagName == expectedTag
                ? `Duplicate <${wrongKey.tagName}> tag.`
                : `<${wrongKey.tagName}> is not allowed here; when the algorithm is ${algText}, there must be exactly one Key element, named <PrivateKey>.`,
              wrongKey.lineNumber,
              wrongKey.columnNumber,
            ),
          );
        };

        // if (keyChildren.length <= 1) {
        if (algOrAlgs[0].tagName == "Algorithm") {
          if (
            // comma-separated list of algs is ok
            ["HS256", "HS384", "HS512"].find((a) => algText.startsWith(a))
          ) {
            const foundCorrectKey = keyChildren.find(
              (child) => child.tagName == "SecretKey",
            );
            if (!foundCorrectKey) {
              flagMissingKey("SecretKey");
            }
            const wrongKeys = keyChildren.filter(
              (keyChild, ix) =>
                keyChild.tagName !== "SecretKey" ||
                keyChildren.indexOf(keyChild) !== ix,
            );

            if (wrongKeys.length > 0) {
              flagWrongKeys(wrongKeys, "SecretKey");
            }
          } else if (
            // comma-separated list of algs is ok
            [
              "RS256",
              "RS384",
              "RS512",
              "PS256",
              "PS384",
              "PS512",
              "ES256",
              "ES384",
              "ES512",
            ].find((a) => algText.startsWith(a))
          ) {
            const foundCorrectKey = keyChildren.find(
              (child) => child.tagName == "PrivateKey",
            );
            if (!foundCorrectKey) {
              flagMissingKey("PrivateKey");
            }
            const wrongKeys = keyChildren.filter(
              (keyChild, ix) =>
                keyChild.tagName !== "PrivateKey" ||
                keyChildren.indexOf(keyChild) !== ix,
            );

            if (wrongKeys.length > 0) {
              flagWrongKeys(wrongKeys, "PrivateKey");
            }
          } else {
            foundIssue = true;
            _addIssue(
              policy,
              `Unrecognized algorithm: ${algText}.`,
              algOrAlgs[0].lineNumber,
              algOrAlgs[0].columnNumber,
            );
          }
        }
      }

      // For any valid element, check allowed children.
      Object.keys(allowedChildren).forEach((elementName) => {
        const elements = xpath.select(`GenerateJWT/${elementName}`, policyRoot);
        elements.forEach((element) => {
          const qualifiedPath = `${element.parentNode.tagName}/${element.tagName}`;
          debug(`checking(1) ${qualifiedPath}...`);
          //debug(`${util.format(element)}...`);
          const elementChildren = xpath.select(`*`, element);
          elementChildren.forEach((child) => {
            if (!allowedChildren[element.tagName].includes(child.tagName)) {
              foundIssue = true;
              _addIssue(
                policy,
                `element <${child.tagName}> is not allowed here.`,
                child.lineNumber,
                child.columnNumber,
              );
            }
          });
        });
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
  onPolicy,
};
