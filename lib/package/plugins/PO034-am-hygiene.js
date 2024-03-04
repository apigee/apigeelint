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
  xpath = require("xpath"),
  util = require("util");

const TEXT_NODE = 3, // these values are not exported by xmldom module!
  CDATA_SECTION_NODE = 4;

const plugin = {
  ruleId,
  name: "Check for element placement within AssignMessage",
  fatal: false,
  severity: 2, // error
  nodeType: "Policy",
  enabled: true
};

const _addIssue = (policy, message, line, column) => {
  const result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    nodeType: plugin.nodeType,
    message,
    line,
    column
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

const allowedChildren = {
  Remove: ["FormParams", "Headers", "Payload", "QueryParams"],
  Set: [
    "FormParams",
    "Headers",
    "Payload",
    "Path",
    "QueryParams",
    "ReasonPhrase",
    "StatusCode",
    "Verb",
    "Version"
  ],
  Add: ["FormParams", "Headers", "QueryParams"],
  AssignVariable: [
    "Name",
    "PropertySetRef",
    "Ref",
    "ResourceURL",
    "Template",
    "Value"
  ],
  Copy: [
    "FormParams",
    "Headers",
    "Path",
    "Payload",
    "QueryParams",
    "ReasonPhrase",
    "StatusCode",
    "Verb",
    "Version"
  ],
  AssignTo: [],
  IgnoreUnresolvedVariables: [],
  Properties: [],
  DisplayName: [],
  Description: [],
  IgnoreUnresolvedProperties: [],
  "FormParams/FormParam": [],
  "Headers/Header": [],
  "QueryParams/QueryParam": [],

  "Set/Verb": [],
  "Set/Path": [],
  "Set/Payloadddd": [],
  "Set/Version": [],
  "AssignVariable/Name": [],
  "AssignVariable/PropertySetRef": [],
  "AssignVariable/Ref": [],
  "AssignVariable/ResourceURL": [],
  "AssignVariable/Template": [],
  "AssignVariable/Value": []
};

const onPolicy = function (policy, cb) {
  let foundIssue = false;

  if (policy.getType() === "AssignMessage") {
    try {
      debug(`policy ${policy.filePath}...`);
      const policyRoot = policy.getElement();
      debug(`root ${policyRoot}...`);
      const allowedTopLevelElements = Object.keys(allowedChildren).filter(
        (key) => !key.includes("/")
      );

      // check for at least one Action element
      const numActions = [
        "Set",
        "Add",
        "Copy",
        "Remove",
        "AssignVariable"
      ].reduce(
        (a, action, _ix) =>
          a + xpath.select(`AssignMessage/${action}`, policyRoot).length,
        0
      );

      if (numActions < 1) {
        foundIssue = true;
        _addIssue(
          policy,
          "This policy does nothing. there is no action element {Set, Copy, Remove, Add, AssignVariable}.",
          1,
          1
        );
      }

      // check for unknown/unsupported elements at the top level
      const foundTopLevelChildren = xpath.select("AssignMessage/*", policyRoot);
      debug(`found ${foundTopLevelChildren.length} toplevel children...`);
      foundTopLevelChildren.forEach((child) => {
        debug(`toplevel child: ${child.tagName}...`);

        if (!allowedTopLevelElements.includes(child.tagName)) {
          foundIssue = true;
          _addIssue(
            policy,
            `element <${child.tagName}> is not allowed here.`,
            child.lineNumber,
            child.columnNumber
          );
        }
      });

      // For 1st level children, excepting AssignVariable, there should be at most one.
      allowedTopLevelElements
        .filter((elementName) => elementName != "AssignVariable")
        .forEach((elementName) => {
          const elements = xpath.select(
            `AssignMessage/${elementName}`,
            policyRoot
          );
          if (elements.length != 0 && elements.length != 1) {
            foundIssue = true;
            elements
              .slice(1)
              .forEach((element) =>
                _addIssue(
                  policy,
                  `extra <${elementName}> element.`,
                  element.lineNumber,
                  element.columnNumber
                )
              );
          }
        });

      // For any valid element, check allowed children.
      Object.keys(allowedChildren).forEach((elementName) => {
        const elements = xpath.select(
          `AssignMessage/${elementName}`,
          policyRoot
        );
        elements.forEach((element) => {
          const qualifiedPath = `${element.parentNode.tagName}/${element.tagName}`;
          debug(`checking(1) ${qualifiedPath}...`);
          //debug(`${util.format(element)}...`);
          const elementChildren = xpath.select(`*`, element);
          const key =
            element.parentNode.tagName == "AssignMessage"
              ? element.tagName
              : qualifiedPath;

          elementChildren.forEach((child) => {
            if (!allowedChildren[key].includes(child.tagName)) {
              foundIssue = true;
              _addIssue(
                policy,
                `element <${child.tagName}> is not allowed here.`,
                child.lineNumber,
                child.columnNumber
              );
            }
          });
        });
      });

      // children of Set/Add should exist, and have text
      ["Set", "Add"].forEach((tag) => {
        const elements = xpath.select(`AssignMessage/${tag}`, policyRoot);
        elements.forEach((element) => {
          debug(`checking(2) ${element.tagName}...`);

          if (element.hasAttributes()) {
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];

              foundIssue = true;
              _addIssue(
                policy,
                `incorrect attribute (${attr.name}) on element <${element.tagName}>.`,
                element.lineNumber,
                element.columnNumber
              );
            }
          }

          const elementChildren = xpath.select(`*`, element);
          if (elementChildren.length == 0) {
            foundIssue = true;
            _addIssue(
              policy,
              `there should be at least one child of <${element.tagName}>.`,
              element.lineNumber,
              element.columnNumber
            );
          }

          // intelligently check for text in child, or child-of-child
          elementChildren.forEach((child) => {
            debug(`child: AssignMessage/${tag}/${child.tagName}`);

            if (allowedChildren[tag].includes(child.tagName)) {
              if (child.tagName.endsWith("s")) {
                const expectedInnerChildTag = child.tagName.slice(0, -1);
                // Headers, QueryParams, FormParams
                if (!child.hasChildNodes()) {
                  foundIssue = true;
                  _addIssue(
                    policy,
                    `no <${expectedInnerChildTag}> under element <${child.tagName}>.`,
                    child.lineNumber,
                    child.columnNumber
                  );
                } else {
                  xpath.select(`*`, child).forEach((innerChild) => {
                    // innerChild = Header, FormParam, QueryParam
                    debug(
                      `innerChild: ${tag}/${child.tagName}/${innerChild.tagName}`
                    );
                    debug(util.format(innerChild.firstChild));

                    if (innerChild.tagName != expectedInnerChildTag) {
                      foundIssue = true;
                      _addIssue(
                        policy,
                        `incorrect element <${innerChild.tagName}> under element <${child.tagName}>.`,
                        innerChild.lineNumber,
                        innerChild.columnNumber
                      );
                    } else {
                      let foundNameAttr = false;
                      if (innerChild.hasAttributes()) {
                        for (let i = 0; i < innerChild.attributes.length; i++) {
                          const attr = innerChild.attributes[i];
                          if (attr.name != "name") {
                            foundIssue = true;
                            _addIssue(
                              policy,
                              `incorrect attribute (${attr.name}) on element <${innerChild.tagName}>.`,
                              innerChild.lineNumber,
                              innerChild.columnNumber
                            );
                          } else {
                            foundNameAttr = true;
                          }
                        }
                      }
                      if (!foundNameAttr) {
                        foundIssue = true;
                        _addIssue(
                          policy,
                          `missing name attribute on element <${innerChild.tagName}>.`,
                          innerChild.lineNumber,
                          innerChild.columnNumber
                        );
                      }

                      // check that innerChild has a text value
                      if (!innerChild.hasChildNodes()) {
                        foundIssue = true;
                        _addIssue(
                          policy,
                          `missing text value for element <${innerChild.tagName}>.`,
                          innerChild.lineNumber,
                          innerChild.columnNumber
                        );
                      } else {
                        if (innerChild.childNodes.length > 1) {
                          foundIssue = true;
                          _addIssue(
                            policy,
                            `extraneous data in element <${innerChild.tagName}>.`,
                            innerChild.lineNumber,
                            innerChild.columnNumber
                          );
                        } else {
                          if (
                            ![TEXT_NODE, CDATA_SECTION_NODE].includes(
                              child.firstChild.nodeType
                            )
                          ) {
                            foundIssue = true;
                            _addIssue(
                              policy,
                              `confounded structure of element <${innerChild.tagName}>.`,
                              innerChild.lineNumber,
                              innerChild.columnNumber
                            );
                          } else {
                            if (!innerChild.firstChild.nodeValue) {
                              foundIssue = true;
                              _addIssue(
                                policy,
                                `missing text for element <${innerChild.tagName}>.`,
                                innerChild.lineNumber,
                                innerChild.columnNumber
                              );
                            }
                          }
                        }
                      }
                    }
                  });
                }
              } else {
                // child is a node like {Verb, Version, Path, Payload}
                // Check that it has exactly one text value.
                // Unless it's a Payload which can take XML!

                if (child.hasAttributes()) {
                  for (let i = 0; i < child.attributes.length; i++) {
                    const attr = child.attributes[i];
                    if (
                      child.tagName != "Payload" ||
                      ![
                        "contentType",
                        "variablePrefix",
                        "variableSuffix"
                      ].includes(attr.name)
                    ) {
                      foundIssue = true;
                      _addIssue(
                        policy,
                        `incorrect attribute (${attr.name}) on element <${child.tagName}>.`,
                        child.lineNumber,
                        child.columnNumber
                      );
                    }
                  }
                }

                if (!child.hasChildNodes()) {
                  foundIssue = true;
                  _addIssue(
                    policy,
                    `missing text value for element <${child.tagName}>.`,
                    child.lineNumber,
                    child.columnNumber
                  );
                } else if (child.childNodes.length > 1) {
                  if (child.tagName != "Payload") {
                    // payload can have XML
                    foundIssue = true;
                    _addIssue(
                      policy,
                      `extraneous data in element <${child.tagName}>.`,
                      child.lineNumber,
                      child.columnNumber
                    );
                  }
                } else if (
                  ![TEXT_NODE, CDATA_SECTION_NODE].includes(
                    child.firstChild.nodeType
                  )
                ) {
                  if (child.tagName != "Payload") {
                    // Set/Payload can have CDATA
                    foundIssue = true;
                    _addIssue(
                      policy,
                      `confounded structure of element <${child.tagName}>.`,
                      child.lineNumber,
                      child.columnNumber
                    );
                  }
                } else if (!child.firstChild.nodeValue) {
                  foundIssue = true;
                  _addIssue(
                    policy,
                    `missing text for element <${child.tagName}>.`,
                    child.lineNumber,
                    child.columnNumber
                  );
                }
              }
            }
          });
        });
      });

      // children of Remove/Copy, if they exist, should have no text,
      // or the text should be a boolean.
      ["Remove", "Copy"].forEach((tag) => {
        const checkSingleChildTextBoolean = (child, tag1, tag2) => {
          //debug(child);
          if (child.childNodes.length > 1) {
            foundIssue = true;
            _addIssue(
              policy,
              `there should be at most a single element under <${tag1}>/<${tag2}>.`,
              child.lineNumber,
              child.columnNumber
            );
          } else {
            if (child.firstChild.nodeType != TEXT_NODE) {
              foundIssue = true;
              _addIssue(
                policy,
                `there should be no non-text elements under <${tag1}>/<${tag2}>.`,
                child.lineNumber,
                child.columnNumber
              );
            } else {
              const text = child.firstChild.data.trim().toLowerCase();
              if (text != "false" && text != "true") {
                foundIssue = true;
                _addIssue(
                  policy,
                  `if there is a text element under <${tag1}>/<${tag2}>, it should be a boolean.`,
                  child.lineNumber,
                  child.columnNumber
                );
              }
            }
          }
        };

        const elements = xpath.select(`AssignMessage/${tag}`, policyRoot);
        elements.forEach((element) => {
          debug(`checking(3) ${element.tagName}...`);

          if (element.hasAttributes()) {
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              if (tag != "Copy" || attr.name != "source") {
                foundIssue = true;
                _addIssue(
                  policy,
                  `incorrect attribute (${attr.name}) on element <${element.tagName}>.`,
                  element.lineNumber,
                  element.columnNumber
                );
              }
            }
          }

          const elementChildren = xpath.select(`*`, element);
          // intelligently check for text in child, or child-of-child
          elementChildren.forEach((child) => {
            debug(`child: AssignMessage/${tag}/${child.tagName}`);

            if (allowedChildren[tag].includes(child.tagName)) {
              if (child.tagName.endsWith("s")) {
                const expectedInnerChildTag = child.tagName.slice(0, -1);
                // Headers, QueryParams, FormParams
                if (child.hasChildNodes()) {
                  xpath.select(`*`, child).forEach((innerChild) => {
                    // innerChild = Header, FormParam, QueryParam
                    debug(
                      `innerChild: ${tag}/${child.tagName}/${innerChild.tagName}`
                    );
                    debug(util.format(innerChild.firstChild));

                    if (innerChild.tagName != expectedInnerChildTag) {
                      foundIssue = true;
                      _addIssue(
                        policy,
                        `incorrect element <${innerChild.tagName}> under element <${child.tagName}>.`,
                        innerChild.lineNumber,
                        innerChild.columnNumber
                      );
                    } else {
                      let foundNameAttr = false;
                      if (innerChild.hasAttributes()) {
                        for (let i = 0; i < innerChild.attributes.length; i++) {
                          const attr = innerChild.attributes[i];
                          if (attr.name != "name") {
                            foundIssue = true;
                            _addIssue(
                              policy,
                              `incorrect attribute (${attr.name}) on element <${innerChild.tagName}>.`,
                              innerChild.lineNumber,
                              innerChild.columnNumber
                            );
                          } else {
                            foundNameAttr = true;
                          }
                        }
                      }
                      if (!foundNameAttr) {
                        foundIssue = true;
                        _addIssue(
                          policy,
                          `missing name attribute on element <${innerChild.tagName}>.`,
                          innerChild.lineNumber,
                          innerChild.columnNumber
                        );
                      }

                      if (innerChild.hasChildNodes()) {
                        // check that there is a single innerChild,
                        // it is text, and it represents a boolean
                        checkSingleChildTextBoolean(
                          innerChild,
                          `${tag}>/<${child.tagName}`,
                          innerChild.tagName
                        );
                      }
                    }
                  });
                }
              } else {
                // Payload, Verb, etc
                if (child.hasChildNodes()) {
                  // check that there is a single innerChild,
                  // it is text, and it represents a boolean
                  checkSingleChildTextBoolean(child, tag, child.tagName);
                }
                if (child.hasAttributes()) {
                  foundIssue = true;
                  for (let i = 0; i < child.attributes.length; i++) {
                    const attr = child.attributes[i];
                    _addIssue(
                      policy,
                      `incorrect attribute (${attr.name}) on element <${child.tagName}>.`,
                      child.lineNumber,
                      child.columnNumber
                    );
                  }
                }
              }
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
  onPolicy
};
