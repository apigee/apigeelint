/*
  Copyright 2019-2020,2025 Google LLC

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

const path = require("node:path"),
  util = require("node:util"),
  ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "ProxyEndpoint hygiene",
  message: "Check ProxyEndpoint hygiene.",
  fatal: false,
  severity: 2, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true,
};

const onProxyEndpoint = function (endpoint, cb) {
  const name = endpoint.getName();
  let flagged = false;
  const mark = (elt, message) => {
    endpoint.addMessage({
      plugin,
      line: elt.lineNumber,
      column: elt.columnNumber,
      message,
    });
    flagged = true;
  };

  try {
    debug(`onProxyEndpoint name(${name})`);
    // At the moment, this plugin checks only for BasePath
    const hpc = endpoint.getHTTPProxyConnection();
    if (hpc) {
      // a sharedflowbundle will not have an HTTPProxyConnection
      const basepathElts = hpc.select("./BasePath");
      if (!basepathElts) {
        mark(hpc.getElement(), "Error performing selection.");
      } else if (basepathElts.length == 0) {
        mark(hpc.getElement(), "Missing required BasePath element.");
      } else if (basepathElts.length != 1) {
        mark(hpc.getElement(), "More than one BasePath element found.");
      }
    }
    if (typeof cb == "function") {
      cb(null, flagged);
    }
  } catch (exc1) {
    console.error("exception in PD006: " + exc1);
    debug(`onProxyEndpoint exc(${exc1})`);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint,
};
