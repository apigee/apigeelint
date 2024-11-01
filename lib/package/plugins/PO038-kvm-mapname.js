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
  ruleId = require("../myUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "KVM/MapName",
  fatal: false,
  severity: 1, // 1=warning, 2=error
  nodeType: "Policy",
  enabled: true,
};

let profile = "apigee";
const onBundle = function (bundle, cb) {
  debug(`onBundle()`);
  profile = bundle.profile;
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const onPolicy = function (policy, cb) {
  let flagged = false;
  const addMessage = (line, column, message) => {
    policy.addMessage({ plugin, message, line, column });
    flagged = true;
  };
  try {
    if (policy.getType() === "KeyValueMapOperations") {
      const mapIdentifier = xpath.select(
        "/KeyValueMapOperations/@mapIdentifier",
        policy.getElement(),
      );
      const mapNameNodeset = xpath.select(
        "/KeyValueMapOperations/MapName",
        policy.getElement(),
      );
      debug(
        `${policy.fileName} found ${mapNameNodeset.length} Set/Payload elements`,
      );
      if (profile == "apigeex") {
        if (mapNameNodeset.length > 1) {
          mapNameNodeset
            .slice(1)
            .forEach((node) =>
              addMessage(
                node.lineNumber,
                node.columnNumber,
                "use at most one MapName element",
              ),
            );
        }
        else if (mapNameNodeset.length == 1) {
          if (mapIdentifier && mapIdentifier[0]) {
            addMessage(
              mapNameNodeset[0].lineNumber,
              mapNameNodeset[0].columnNumber,
              "use mapIdentifier attribute or MapName element, not both",
            );
          }
          let text = xpath.select('text()', mapNameNodeset[0]);
          text = text && text[0] && text[0].data;
          let ref = xpath.select('@ref', mapNameNodeset[0]);
          debug('ref: ' + util.format(ref));
          ref = ref && ref[0] && ref[0].value;

          if ( ! text && !ref ) {
            addMessage(
              mapNameNodeset[0].lineNumber,
              mapNameNodeset[0].columnNumber,
              "The MapName element must specify a @ref attribute, or a text value"
            );
          }

        } else {
          // no MapName element
          if ( ! mapIdentifier || !mapIdentifier[0]) {
            addMessage(
              policy.getElement().lineNumber,
              policy.getElement().columnNumber,
              "Specify the map name via either the mapIdentifier attribute, or the MapName element",
            );
          }
        }
      } else {
        if (mapNameNodeset.length > 0) {
          mapNameNodeset.forEach((node) =>
            addMessage(
              node.lineNumber,
              node.columnNumber,
              "inappropriate MapName element for apigee profile",
            ),
          );
        }
        if (!mapIdentifier || !mapIdentifier[0]) {
          addMessage(
            policy.getElement().lineNumber,
            policy.getElement().columnNumber,
            "missing mapIdentifier attribute",
          );
        }
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
  onBundle,
  onPolicy,
};
