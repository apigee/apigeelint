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

//mgmtServerTargetEndpointCheck
//| &nbsp; |:white_medium_square:| TD001 | Mgmt Server as Target |  Discourage calls to the Management Server from a Proxy via target. |

var plugin = {
    ruleId: "TD001",
    name: "Discourage accessing management server from a proxy.",
    message: "Management server is intended for administrative tasks.",
    fatal: false,
    severity: 2, //error
    nodeType: "TargetEndpoint",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  xpath = require("xpath"),
  regexp = "(/v1/organizations/|enterprise.apigee.com)";

var onTargetEndpoint = function(target, cb) {
  //get /TargetEndpoint/HTTPTargetConnection/URL
  var url = xpath.select(
      "/TargetEndpoint/HTTPTargetConnection/URL/text()",
      target.getElement()
    ),
    warnErr = false;

  if (url && url[0] && url[0].data.match(regexp)) {
    target.addMessage({
      plugin,
      message: "TargetEndpoint appears to be connecting to Management Server."
    });
    warnErr = true;
  }
  if (typeof(cb) == 'function') {
    cb(null, warnErr);
  }
};

module.exports = {
  plugin,
  onTargetEndpoint
};
