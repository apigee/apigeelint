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

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
    ruleId,
    name: "jsHint",
    message: "jsHint applied to all javascript resource callouts.",
    fatal: false,
    severity: 1,
    nodeType: "Resource",
    enabled: true
      };

let hadWarnErr=false;

const jshint = require("jshint"),
      jsHintCli = require("jshint/src/cli.js");

const getMessageClass = function(s) {
        if (/E\d{3}/.test(s)) return "error";
        if (/W\d{3}/.test(s)) return "warning";
        if (/I\d{3}/.test(s)) return "info";
        return "message";
      };

const onResource = function(resource, cb) {
  try {
    let fname = resource.getFileName();
    debug("onResource(): " + resource.path);
    if (
      fname.endsWith(".jsc") ||
      fname.endsWith(".js") ||
      fname.endsWith(".json")
    ) {
      let jsHintOptions = jsHintCli.getConfig(resource.path);
      delete jsHintOptions.dirname;
      if (Object.keys(jsHintOptions).length == 0) {
        // default apigeelint options
        debug('applying default options');
        jsHintOptions = { maxerr: 50};
      }

      debug('options:' + JSON.stringify(jsHintOptions));
      if ( !jshint.JSHINT(resource.getContents(), jsHintOptions) ) {
        jshint.JSHINT.errors.forEach(function(error) {
          if (error.code !== "W087") {
            var result = {
              plugin,
              severity: (/E\d{3}/.test(error.code)) ? 2 : 1,
              source: error.evidence,
              line: error.line,
              column: error.character,
              message: getMessageClass(error.code) + ` ${error.code}: ${error.reason}`
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
