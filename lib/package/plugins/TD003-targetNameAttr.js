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

const ruleId = require("../myUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "TargetEndpoint Name",
  message: "Check TargetEndpoint name attribute against file name.",
  fatal: false,
  severity: 2,  // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true
};

const path = require('path'),
      debug = require("debug")("apigeelint:" + ruleId);

const onTargetEndpoint = function(endpoint, cb) {
        let shortFilename = path.basename(endpoint.getFileName()),
            basename = shortFilename.split(".xml")[0],
            nameFromAttribute = endpoint.getName(),
            flagged = false;

        try {
          debug(`onTargetEndpoint shortfile(${shortFilename}) nameFromAttr(${nameFromAttribute})`);
          if (basename !== nameFromAttribute) {
            let nameAttr = endpoint.select('//@name');
            endpoint.addMessage({
              plugin,
              line: nameAttr[0].lineNumber,
              column: nameAttr[0].columnNumber,
              message: `File basename (${basename}) does not match endpoint name (${nameFromAttribute}).`
            });
            flagged = true;
          }
          if (typeof(cb) == 'function') {
            cb(null, flagged);
          }
        }
        catch (exc1) {
          console.error('exception: ' + exc1);
          debug(`onTargetEndpoint exc(${exc1})`);
        }
      };

module.exports = {
  plugin,
  onTargetEndpoint
};
