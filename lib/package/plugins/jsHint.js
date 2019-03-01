/*
  Copyright 2019 Google LLC

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

var plugin = {
    ruleId: "PO013",
    name: "jsHint",
    message: "jsHint applied to all javascript resource callouts.",
    fatal: false,
    severity: 1,
    nodeType: "Resource",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name), hadWarnErr=false;

var onResource = function(resource, cb) {
  try {
    var fname = resource.getFileName();
    if (
      fname.endsWith(".jsc") ||
      fname.endsWith(".js") ||
      fname.endsWith(".json")
    ) {
      var jshint = require("jshint");
      //must be a jsc js or json resource
      if (
        !jshint.JSHINT(`/*jshint maxerr: 50 */\n` + resource.getContents())
      ) {
        var errors = jshint.JSHINT.errors;
        //now walk through each error
        errors.forEach(function(error) {
          if (error.code !== "W087") {
            if (error.id === "(error)") {
              plugin.severity = 2;
            } else {
              plugin.severity = 1;
            }
            var result = {
              plugin,
              source: error.evidence,
              line: error.line,
              column: error.character,
              message: error.id + ": " + error.reason
            };
            resource.addMessage(result);
            hadWarnErr=true;
          }
        });
      }
    }
  } catch (e) {
    debugger;
    debug("jshint error" + e);
  }
  if (typeof cb == "function") {
    cb(null, hadWarnErr);
  }
};

module.exports = {
  plugin,
  onResource
};
