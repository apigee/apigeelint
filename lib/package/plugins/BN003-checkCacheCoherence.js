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

//BN003 Cache Coherence A bundle that includes cache reads should include cache writes with the same keys.

const xpath = require("xpath"),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Cache Coherence",
        message:
        "Cache strategies that rely on external cache population can be problematic and lead to run time errors.",
        fatal: false,
        severity: 2, //error
        nodeType: "Cache",
        enabled: true
      };

let store = { LookupCache: {}, PopulateCache: {} }, hadWarnErr=false;

const onBundle = function(bundle, cb) {
  //is it a cache policy?
  //is it attached?
  bundle.getPolicies().forEach(function(policy) {
    if (
      (policy.getType() === "PopulateCache" ||
        policy.getType() === "LookupCache") &&
      policy.getSteps().length > 0
    ) {
      var prefix = xpath.select(
          "//CacheKey/Prefix/text()",
          policy.getElement()
        ),
        keyFragmentRef = xpath.select(
          "//CacheKey/KeyFragment/@ref/text()",
          policy.getElement()
        ),
        keyFragment = xpath.select(
          "//CacheKey/KeyFragment/text()",
          policy.getElement()
        );

      prefix = (prefix[0] && prefix[0].data) || "";
      keyFragmentRef = (keyFragmentRef[0] && keyFragmentRef[0].data) || "";
      keyFragment = (keyFragment[0] && keyFragment[0].data) || "";

      //ok now we have the key values for the cache policy, lets stow them if they don't already exist
      //use a composite key
      store[policy.getType()][
        prefix + "-" + keyFragmentRef + "-" + keyFragment
      ] = policy;
    }
  });
  //now inspect the store object
  //for every lookup key we expect a populate key
  for (var lookupKey in store["LookupCache"]) {
    if (!store["PopulateCache"][lookupKey]) {
      //report an error
      //the object in the store is the policy so we can report directly against it
      store["LookupCache"][lookupKey].addMessage({
        plugin,
        message: "LookupCache may not have a corresponding PopulateCache."
      });
      hadWarnErr=true;
    }
  }

  if (typeof(cb) == 'function') {
    cb(null,hadWarnErr);
  }
};

module.exports = {
  plugin,
  onBundle
};
