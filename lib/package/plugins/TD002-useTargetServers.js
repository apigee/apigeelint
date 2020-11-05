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

//useTargetServers
//| &nbsp; |:white_medium_square:| TD002 | Use Target Server |  Discourage use of direct URLs in Target Server. |

const xpath = require("xpath"),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

var plugin = {
    ruleId,
    name: "Discourage use of direct URLs in Target Server.",
    message: "Using a Target Server simplifies CI/CD.",
    fatal: false,
    severity: 1, //warn
    nodeType: "TargetEndpoint",
    enabled: true
    };

var onTargetEndpoint = function(target, cb) {
  //get /TargetEndpoint/HTTPTargetConnection/URL
  var hadWarnErr = false;
  var url = xpath.select(
      "/TargetEndpoint/HTTPTargetConnection/URL/text()",
      target.getElement()
    );

  if (url && url[0] !== undefined ) {
    let name = target.getName();
    target.addMessage({
      plugin,
      message: `TargetEndpoint (${name}) is using URL (${url}), using a Target Server simplifies CI/CD.`
    });
    hadWarnErr=true;
  }

  if (typeof cb == "function") {
    cb(null,hadWarnErr);
  }
  return hadWarnErr;
};

module.exports = {
  plugin,
  onTargetEndpoint
};
