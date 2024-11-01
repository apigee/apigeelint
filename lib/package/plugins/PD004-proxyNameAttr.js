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

const path = require("path"),
  ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "ProxyEndpoint Name",
  message: "Check ProxyEndpoint name attribute against file name.",
  fatal: false,
  severity: 2, // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true
};

const onProxyEndpoint = function (endpoint, cb) {
  const shortFilename = path.basename(endpoint.getFileName()),
    basename = shortFilename.split(".xml")[0],
    nameFromAttribute = endpoint.getName();
  let flagged = false;

  try {
    debug(
      `onProxyEndpoint shortfile(${shortFilename}) nameFromAttr(${nameFromAttribute})`
    );
    if (!nameFromAttribute) {
      const rootElement = endpoint.getElement();
      endpoint.addMessage({
        plugin,
        line: rootElement.lineNumber,
        column: rootElement.columnNumber,
        message: `ProxyEndpoint has no name attribute.`
      });
      flagged = true;
    } else if (basename !== nameFromAttribute) {
      const nameAttr = endpoint.select("//@name");
      endpoint.addMessage({
        plugin,
        line: nameAttr[0].lineNumber,
        column: nameAttr[0].columnNumber,
        message: `File basename (${basename}) does not match endpoint name (${nameFromAttribute}).`
      });
      flagged = true;
    }
    if (typeof cb == "function") {
      cb(null, flagged);
    }
  } catch (exc1) {
    console.error("exception: " + exc1);
    debug(`onProxyEndpoint exc(${exc1})`);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};
