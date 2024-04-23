/*
  Copyright 2019-2024 Google LLC

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
  name: "Check for element placement within Quota",
  fatal: false,
  severity: 2, // error
  nodeType: "Policy",
  enabled: true
};

const allowedChildrenApigee = {
  DisplayName: [],
  Properties: [],
  Allow: ["Class"],
  Interval: [],
  Distributed: [],
  Synchronous: [],
  TimeUnit: [],
  Identifier: [],
  MessageWeight: [],
  StartTime: [],
  AsynchronousConfiguration: ["SyncIntervalInSeconds", "SyncMessageCount"],
  UseQuotaConfigInAPIProduct: ["DefaultConfig"],
  "UseQuotaConfigInAPIProduct/DefaultConfig": ["Allow", "Interval", "TimeUnit"],
  "UseQuotaConfigInAPIProduct/DefaultConfig/Allow": [],
  "UseQuotaConfigInAPIProduct/DefaultConfig/Interval": [],
  "UseQuotaConfigInAPIProduct/DefaultConfig/TimeUnit": [],
  "AsynchronousConfiguration/SyncIntervalInSeconds": [],
  "AsynchronousConfiguration/SyncMessageCount": [],
  "Allow/Class": ["Allow"]
};

const additionalAllowedChildrenApigeex = {
  CountOnly: [],
  EnforceOnly: [],
  SharedName: []
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

const onPolicy = function (quotaPolicy, cb) {
  let foundIssue = false;
  const addIssue = (message, line, column) => {
    const result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      nodeType: plugin.nodeType,
      message,
      line,
      column
    };
    foundIssue = true;
    quotaPolicy.addMessage(result);
  };

  const allowedChildren =
    bundleProfile == "apigee"
      ? allowedChildrenApigee
      : { ...allowedChildrenApigee, ...additionalAllowedChildrenApigeex };
  if (quotaPolicy.getType() === "Quota") {
    try {
      debug(`policy ${quotaPolicy.filePath}...`);
      debug(`profile ${bundleProfile}...`);
      const policyRoot = quotaPolicy.getElement();
      debug(`root ${policyRoot}...`);
      const allowedTopLevelElements = Object.keys(allowedChildren).filter(
        (key) => !key.includes("/")
      );
      debug(
        `allowed toplevel elts: ${JSON.stringify(allowedTopLevelElements)}...`
      );

      // 1. check for unknown/unsupported elements at the top level
      const foundTopLevelChildren = xpath.select("/Quota/*", policyRoot);
      debug(`found ${foundTopLevelChildren.length} toplevel children...`);
      foundTopLevelChildren.forEach((child) => {
        debug(`toplevel child: ${child.tagName}...`);

        if (!allowedTopLevelElements.includes(child.tagName)) {
          addIssue(
            `element <${child.tagName}> is not allowed here.`,
            child.lineNumber,
            child.columnNumber
          );
        }
      });

      // 2. For 1st level children, there should be at most one.
      allowedTopLevelElements.forEach((elementName) => {
        const elements = xpath.select(`${elementName}`, policyRoot);
        if (elements.length != 0 && elements.length != 1) {
          elements
            .slice(1)
            .forEach((element) =>
              addIssue(
                `extra <${elementName}> element.`,
                element.lineNumber,
                element.columnNumber
              )
            );
        }
      });

      // 3. There must be all of {Interval, TimeUnit, Allow}, or
      // UseQuotaConfigInAPIProduct, but not both.
      const useApiProductElement = xpath.select1(
        "UseQuotaConfigInAPIProduct",
        policyRoot
      );
      if (useApiProductElement) {
        ["Interval", "TimeUnit", "Allow"].forEach((elementName) => {
          const elements = xpath.select(`Quota/${elementName}`, policyRoot);
          if (elements.length > 0) {
            addIssue(
              `element <${elementName}> conflicts with <UseQuotaConfigInAPIProduct>.`
            );
          }
        });

        // the stepName referenced should exist
        const elt = useApiProductElement;
        const stepNameAttr = xpath.select1("//@stepName", elt);
        if (!stepNameAttr) {
          addIssue(
            `missing stepName attribute.`,
            elt.lineNumer,
            elt.columnNumber
          );
        } else {
          try {
            const referencedCredentialVerificationPolicy = stepNameAttr.value;
            if (
              referencedCredentialVerificationPolicy == quotaPolicy.getName()
            ) {
              // must not refer to self
              addIssue(
                `the stepName attribute refers to the Quota policy itself.`,
                elt.lineNumer,
                elt.columnNumber
              );
            } else {
              const bundlePolicies = quotaPolicy.parent.getPolicies();
              const referredPolicy = bundlePolicies.find(
                (p) => p.name == referencedCredentialVerificationPolicy
              );
              if (!referredPolicy) {
                addIssue(
                  `the stepName attribute refers to a policy that does not exist.`,
                  elt.lineNumer,
                  elt.columnNumber
                );
              } else {
                // the policy must be of the correct type
                const referredPtype = referredPolicy.getType();

                if (referredPtype != "VerifyAPIKey") {
                  if (referredPtype == "OAuthV2") {
                    const referredPolicyElement = referredPolicy.getElement();
                    const operation = xpath.select1(
                      "/OAuthV2/Operation",
                      referredPolicyElement
                    );
                    if (
                      !operation.startsWith("Verify") ||
                      !operation.endsWith("Token")
                    ) {
                      addIssue(
                        `the stepName attribute refers to an OAuthV2 policy with the wrong Operation.`,
                        elt.lineNumer,
                        elt.columnNumber
                      );
                    }
                  } else {
                    addIssue(
                      `the stepName attribute refers to a policy of the wrong type.`,
                      elt.lineNumer,
                      elt.columnNumber
                    );
                  }
                }
              }
            }
          } catch (e) {
            // This error can be thrown during unit testing.
            if (
              e.toString() !=
              "TypeError: quotaPolicy.parent.getPolicies is not a function"
            ) {
              addIssue(
                `could not inspect policies for bundle.` + e.toString(),
                elt.lineNumer,
                elt.columnNumber
              );
            }
          }
        }
      } else {
        ["Interval", "TimeUnit", "Allow"].forEach((elementName) => {
          const elements = xpath.select(`${elementName}`, policyRoot);
          if (elements.length == 0) {
            addIssue(`missing <${elementName}> element.`);
          }
        });
      }

      // 4. Some of the elements ought to be boolean only
      const booleanElements = ["Distributed", "Synchronous"];
      if (bundleProfile == "apigeex") {
        booleanElements.push(...["CountOnly", "EnforceOnly"]);
      }
      booleanElements.forEach((elementName) => {
        const element = xpath.select1(`${elementName}`, policyRoot);
        if (element) {
          let textValue = xpath.select1("text()", element);
          textValue = textValue && textValue.data.trim().toLowerCase();
          if (textValue && !["true", "false"].includes(textValue)) {
            addIssue(
              `value for <${elementName}> should be one of [true,false].`,
              element.lineNumber,
              element.columnNumber
            );
          }
        }
      });

      // 5. if using CountOnly/EnforceOnly, there must be a SharedName
      ["CountOnly", "EnforceOnly"].forEach((elementName) => {
        const element = xpath.select1(`${elementName}`, policyRoot);
        if (element) {
          const requisiteElement = xpath.select1("SharedName", policyRoot);
          if (!requisiteElement) {
            addIssue(
              `missing <SharedName> element when using <${elementName}>`,
              element.lineNumber,
              element.columnNumber
            );
          }
        }
      });

      // 6. For MessageWeight, disallow text(), require @ref
      const mwElement = xpath.select1(`MessageWeight`, policyRoot);
      if (mwElement) {
        const textValue = xpath.select1("text()", mwElement);
        if (textValue) {
          addIssue(
            `element <${mwElement.tagName}> must not have a text value.`,
            mwElement.lineNumber,
            mwElement.columnNumber
          );
        }

        const ref = xpath.select1("//@ref", mwElement);
        debug(`checking for ref attr...${ref}`);
        debug(`!ref attr truthy...${!ref}`);
        if (!ref) {
          addIssue(
            `element <${mwElement.tagName}> must have a ref attribute.`,
            mwElement.lineNumber,
            mwElement.columnNumber
          );
        }
      }

      // 7. For AsynchronousConfiguration, only one child
      const asyncElement = xpath.select1(
        `AsynchronousConfiguration`,
        policyRoot
      );
      if (asyncElement) {
        const validChildElements = [
          "SyncIntervalInSeconds",
          "SyncMessageCount"
        ];
        const condition = validChildElements
          .map((n) => `self::${n}`)
          .join(" or ");

        const children = xpath.select(`*[${condition}]`, asyncElement);
        if (children.length != 1) {
          addIssue(
            `element <${
              asyncElement.tagName
            }> must have exactly one of {${validChildElements.join(
              ", "
            )}} as a child.`,
            asyncElement.lineNumber,
            asyncElement.columnNumber
          );
        }
        const child = children[0];
        const textValue = xpath.select1("text()", child);
        debug(`asynch textValue (${textValue})...`);

        const intValue = textValue && parseInt(textValue, 10);
        if (!textValue || !intValue || intValue <= 0) {
          addIssue(
            `element <${child.tagName}> must have a text value representing an integer.`,
            child.lineNumber,
            child.columnNumber
          );
        }
      }

      // 8. For any valid element, check allowed children.
      Object.keys(allowedChildren).forEach((elementPath) => {
        debug(`checking allowedChildren for ${elementPath}...`);
        const childElements = xpath.select(`${elementPath}/*`, policyRoot);
        if (elementPath.includes("/")) {
          debug(`child elements (${childElements})...`);
        }
        debug(`examining each child of ${elementPath}...`);

        childElements.forEach((childElement) => {
          try {
            const qualifiedPath = `${childElement.parentNode.tagName}/${childElement.tagName}`;
            debug(`checking(1) ${qualifiedPath}...`);
            if (!allowedChildren[elementPath].includes(childElement.tagName)) {
              addIssue(
                `element <${childElement.tagName}> is not allowed here.`,
                childElement.lineNumber,
                childElement.columnNumber
              );
            }
          } catch (e) {
            addIssue(
              `logic error: ${e}`,
              childElement && childElement.lineNumber,
              childElement && childElement.columnNumber
            );
          }
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
  onBundle,
  onPolicy
};
