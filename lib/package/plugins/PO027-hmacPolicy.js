/*
  Copyright 2019-2020 Google LLC

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

const path = require('path'),
      xpath = require("xpath"),
      util = require('util'),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "HMACUsage",
        fatal: false,
        severity: 2, //error
        nodeType: "HMAC",
        enabled: true
      };

const onPolicy = function(policy, cb) {
        let flagged = false;
        let node = null;
        const addMessage = (line, column, message) => {
                policy.addMessage({plugin, message, line, column});
                flagged = true;
              };
            const addNodeMessage = (message) =>
                    addMessage(node.lineNumber, node.columnNumber, message);

        if (policy.getType() === "HMAC") {
          debug(policy);
          const secretKeyNodes = xpath.select("/HMAC/SecretKey", policy.getElement());
          if (secretKeyNodes.length == 0) {
            addMessage(1, 0, "Missing SecretKey element");
          } else if (secretKeyNodes.length>1) {
            addMessage(secretKeyNodes[1].lineNumber, secretKeyNodes[1].columnNumber,
                       "More than one SecretKey element");
          }
          else {
            node = secretKeyNodes[0];
            const refNodes = xpath.select("@ref", node);
            if (refNodes.length == 0) {
              addNodeMessage("SecretKey must use a ref= attribute");
            }
            else if (refNodes.length > 1) {
              addNodeMessage("More than one ref= attribute on SecretKey");
            }
            else {
              const refAttr = refNodes[0];
              if ( ! refAttr.value) {
                addNodeMessage("empty ref= attribute on SecretKey");
              }
              else if (!refAttr.value.startsWith('private.')) {
                addNodeMessage('"private." is the only supported prefix for SecretKey ref attribute.');
              }
            }
          }

          const algNodes = xpath.select("/HMAC/Algorithm", policy.getElement());
          if (algNodes.length == 0) {
            addMessage(1, 0, "Missing Algorithm element");
          } else if (algNodes.length>1) {
            addMessage(algNodes[1].lineNumber, algNodes[1].columnNumber,
                       "More than one Algorithm element");
          }
          else {
            node = algNodes[0];
            let textNodes = xpath.select("text()", node);
            if (textNodes.length != 1) {
              addMessage("Algorithm element should have a single Text child");
            }
            else {
              let algName = textNodes[0].data;
              if (algName != algName.trim()) {
                addMessage("algorithm name value should not have leading/trailing whitespace");
              }
            }
            //debug(node);
          }

        }
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onPolicy
};
