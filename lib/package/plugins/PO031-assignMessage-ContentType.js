/*
  Copyright 2019-2021 Google LLC

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

const xpath = require("xpath"),
      util = require('util'),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "AM/ContentType",
        fatal: false,
        severity: 1, // warning
        nodeType: "Policy",
        enabled: true
      };

const onPolicy = function(policy, cb) {
        let flagged = false;
        const addMessage = (line, column, message) => {
                policy.addMessage({plugin, message, line, column});
                flagged = true;
              };
        try {
          if (policy.getType() === "AssignMessage") {
            const nodeset = xpath.select("/AssignMessage/Set/Payload", policy.getElement());
            if (nodeset.length>0) {
              debug(`${policy.fileName} found ${nodeset.length} Set/Payload elements`);
              if (nodeset.length>1) {
                nodeset.slice(1).forEach( node =>
                                          addMessage(node.lineNumber, node.columnNumber, "extraneous Set/Payload element"));
              }
              else {
                const payloadElt = nodeset[0],
                      ctypeAttr = xpath.select1('@contentType', payloadElt);

                const headerSet = xpath.select("../Headers/Header[translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'content-type']", payloadElt);
                let headerElt;
                if (headerSet.length>0) {
                  if (headerSet.length>1) {
                    debug(`${policy.fileName} found ${headerSet.length} Set/Headers/Header[@content-type] elements`);
                    headerSet.slice(1).forEach( node =>
                                                addMessage(node.lineNumber, node.columnNumber, "redundant Header element"));
                  }
                  else {
                    headerElt = headerSet[0];
                  }
                }
                if (ctypeAttr && headerElt) {
                  addMessage(headerElt.lineNumber, headerElt.columnNumber, "redundant Header element. Set/Payload already specifies the content-type.");
                }
                if ( ! ctypeAttr && !headerElt) {
                  addMessage(payloadElt.lineNumber, payloadElt.columnNumber, "Neither @contentType attribute nor a Header[@name='content-type'] has been defined.");
                }
              }
            }
            else {
              debug(`${policy.fileName} found no Set/Payload elements`);
            }
          }
          if (typeof(cb) == 'function') {
            cb(null, flagged);
          }
        }
        catch(e) {
          debug(util.format(e));
        }
      };

module.exports = {
  plugin,
  onPolicy
};
