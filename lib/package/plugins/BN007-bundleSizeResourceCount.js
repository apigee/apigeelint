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

//bundleSizeResourceCount
//| &nbsp; |:white_medium_square:| BN007 | Bundle size - resource callouts. |  Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies. |

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name:
        "Check number of resources present in the bundle as a gauge of bundle size",
        message:
        "Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies or over orchestration in the API tier.",
        fatal: false,
        severity: 1, //warn
        nodeType: "Bundle",
        enabled: true
      };

const onBundle = function(bundle, cb) {
  let limit = 20,
    resources = bundle.getResources(),
    hadWarnErr = false;

  if (resources.length > limit) {
    bundle.addMessage({
      plugin,
      message:
        "More (" +
        resources.length +
        ") than recommended resources (" +
        limit +
        ") in bundle."
    });
    hadWarnErr = true;
  }
  if (typeof(cb) == 'function') {
    cb(null, hadWarnErr);
  }
  return hadWarnErr;
};

module.exports = {
  plugin,
  onBundle
};
