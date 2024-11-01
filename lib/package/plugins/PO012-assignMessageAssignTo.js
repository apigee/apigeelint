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

const xpath = require("xpath"),
  util = require("util"),
  ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "AssignTo",
  fatal: false,
  severity: 1, // warning
  nodeType: "AssignMessage",
  enabled: true
};

const onPolicy = function (policy, cb) {
  let flagged = false;
  const addMessage = (line, column, message) => {
    policy.addMessage({ plugin, message, line, column });
    flagged = true;
  };
  try {
    if (policy.getType() === "AssignMessage") {
      const atNodes = xpath.select(
        "/AssignMessage/AssignTo",
        policy.getElement()
      );
      const formatAttrs = (node) =>
        node.attributes && node.attributes.length
          ? `(attrs: ${Array.prototype.map
              .call(node.attributes, (at) => at.localName)
              .join(", ")})`
          : "(no attributes)";

      debug(`policy ${policy.fileName} parent ${policy.parent.root}`);
      debug(`${policy.fileName} atNodes ${util.format(atNodes)}`);
      if (atNodes && atNodes.length > 0) {
        debug(`${policy.fileName} found ${atNodes.length} AssignTo elements`);
        if (atNodes.length > 1) {
          atNodes
            .slice(1)
            .forEach((node, _ix) =>
              addMessage(
                node.lineNumber,
                node.columnNumber,
                "extraneous AssignTo element"
              )
            );
        } else {
          const node = atNodes[0];
          debug(`node: ${node.tagName} ${formatAttrs(node)}`);
          const textNodes = xpath.select("text()", node);
          const text = textNodes[0] && textNodes[0].data;
          debug(`text: ` + text);
          const attrs = ["transport", "createNew", "type"].reduce(
            (map, item) => {
              const attr = xpath.select1("@" + item, node);
              map[item] = attr ? attr.value : null;
              return map;
            },
            {}
          );
          debug(`attrs: ` + JSON.stringify(attrs));
          if (attrs.transport && attrs.transport != "http") {
            addMessage(
              node.lineNumber,
              node.columnNumber,
              "unsupported transport attribute in AssignTo element"
            );
          }
          if (attrs.createNew && attrs.createNew == "false" && !text) {
            addMessage(
              node.lineNumber,
              node.columnNumber,
              "unnecessary AssignTo with no named message"
            );
          }
          if (
            attrs.type &&
            attrs.type != "request" &&
            attrs.type != "response"
          ) {
            addMessage(
              node.lineNumber,
              node.columnNumber,
              "unrecognized type attribute in AssignTo"
            );
          }
        }
      } else {
        debug(`${policy.fileName} found no AssignTo elements`);
      }
    }
    if (typeof cb == "function") {
      cb(null, flagged);
    }
  } catch (e) {
    debug(util.format(e));
  }
};

module.exports = {
  plugin,
  onPolicy
};
