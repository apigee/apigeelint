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
  name: "Check ServiceCallout for Response element",
  message:
    "There should be a simple text value in the Response element for the ServiceCallout policy.",
  fatal: false,
  severity: 2, //2=error
  nodeType: "Policy",
  enabled: true
};

const onPolicy = function (policy, cb) {
  let hadWarning = false;
  if (policy.getType() === "ServiceCallout") {
    debug(`found policy ${policy.getName()}`);
    const responseElts = xpath.select(
      "/ServiceCallout/Response",
      policy.getElement()
    );
    try {
      if (responseElts && responseElts[0]) {
        debug(`found ${responseElts.length} response element(s)`);
        if (responseElts[1]) {
          hadWarning = true;
          policy.addMessage({
            plugin,
            message: "Policy has more than one Response element."
          });
        }
        const textValue =
          responseElts[0].childNodes &&
          responseElts[0].childNodes[0] &&
          responseElts[0].childNodes[0].nodeValue;
        debug(`textValue '${textValue}'`);
        if (textValue && textValue.trim()) {
          const re1 = new RegExp("\\s", "g");
          if (re1.test(textValue)) {
            hadWarning = true;
            policy.addMessage({
              plugin,
              message:
                "When the Response element is present, the TEXT value should have no spaces."
            });
          }
        } else if (!textValue || !textValue.trim()) {
          hadWarning = true;
          policy.addMessage({
            plugin,
            message:
              "The Response element, when present, should specify a non-empty TEXT value."
          });
        }
        const attrs = xpath.select("@*", responseElts[0]);

        if (attrs && attrs[0]) {
          hadWarning = true;
          policy.addMessage({
            plugin,
            message:
              "The Response element, when present, should not specify any attributes."
          });
        }
      }
    } catch (e1) {
      hadWarning = true;
      policy.addMessage({
        plugin,
        message: "Exception while examining Response element: " + e1.message
      });
    }
  }
  if (typeof cb == "function") {
    cb(null, hadWarning);
  }
};

module.exports = {
  plugin,
  onPolicy
};
