/*
  Copyright 2019-2023,2025 Google LLC

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
  jsonpath = require("jsonpath"),
  ruleId = lintUtil.getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check ExtractVariables JSONPaths",
  fatal: false,
  severity: 2, //1= warning, 2=error
  nodeType: "Policy",
  enabled: true,
};

// <ExtractVariables name = "ExtractVariables-3">
//   <Source> response </Source>
//   <JSONPayload>
//     <Variable name = "latitude" type = "float" >
//       <JSONPath> $.results[0].geometry.location.lat </JSONPath>
//     </Variable>
//     <Variable name = "longitude" type = "float" >
//       <JSONPath> $.results[0].geometry.location.lng </JSONPath>
//     </Variable>
//   </JSONPayload>
//   <VariablePrefix> geocoderesponse </VariablePrefix>
// </ExtractVariables>

let bundleProfile = "apigee";
const onBundle = function (bundle, cb) {
  if (bundle.profile) {
    bundleProfile = bundle.profile;
  }
  if (typeof cb == "function") {
    cb(null, false);
  }
};
const fixupDotSquare = (s) => s.replaceAll(/\.\[/g, "[");
const fixupDollarDot = (s) => (s == "$." || s == "$.." ? "$" : s);

const isApigeeX = () => bundleProfile == "apigeex";

const onPolicy = function (policy, cb) {
  let foundIssue = false;
  if (policy.getType() === "ExtractVariables") {
    let selection = policy.select(`/ExtractVariables/JSONPayload`);
    if (selection && selection[0]) {
      const addMessage = (msg, elt, others) => {
        policy.addMessage({
          plugin,
          line: elt.lineNumber,
          column: elt.columnNumber,
          message: msg,
        });
        foundIssue = true;
      };
      /*
       * Look only at any JSONPath in the first JSONPayload; there may be more
       * than one JSONPayload, but that is an error which is flagged in a
       * different plugin.  There may be multiple JSONPath elements under each
       * Variable, and multiple Variables too. That is allvalid.  The following
       * xpath will get what we want.
       **/
      selection = policy.select(
        `/ExtractVariables/JSONPayload[1]/Variable/JSONPath`,
      );
      if (selection && selection.length) {
        const util = require("util");
        selection.forEach((elt, _ix) => {
          debug(`elt: ${elt}`);
          let textValue =
            elt && elt.childNodes[0] && elt.childNodes[0].nodeValue;
          if (!textValue) {
            addMessage(`JSONPath is empty`, elt);
          } else {
            textValue = textValue.trim();
            if (isApigeeX() && (textValue == "$." || textValue == "$..")) {
              // it works in Apigee Edge
              addMessage(
                `JSONPath (${textValue}) is not valid in jsonpath`,
                elt,
              );
            } else if (textValue.startsWith("{") && textValue.endsWith("}")) {
              //JSONPath is a variable, then ignore the check with a warning
              policy.addMessage({
                plugin,
                message: `JSONPath (${textValue}) is using a variable, so ignoring checks on the JSONPath`,
                severity: 1, // 1=warning, 2=error
                line: elt.lineNumber,
                column: elt.columnNumber,
              });
            } else {
              // attempt to compile the jsonpath expression
              try {
                let v = fixupDotSquare(textValue);
                if (!isApigeeX()) {
                  // The expression '$.' «works» in Apigee Edge, but it
                  // does not compile in JavaScript. So we just fix that up here.
                  v = fixupDollarDot(v);
                }
                jsonpath.parse(v);
              } catch (exc1) {
                // parse fail means not valid jsonpath
                addMessage(`JSONPath (${textValue}) is invalid (${exc1})`, elt);
              }
            }
          }
        });
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
  onPolicy,
  onBundle,
};
