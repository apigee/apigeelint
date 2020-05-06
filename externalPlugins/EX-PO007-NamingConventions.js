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
    ruleId: "EX-PO007",
    name: "Policy Naming Conventions - type indication",
    message:
      "It is recommended that the policy name include an indicator of the policy type.",
    fatal: false,
    severity: 1, //warning
    nodeType: "Policy",
    enabled: true
  },
  policyMetaData = {
    AccessControl: { indications: ["AC-"] },
    AccessEntity: { indications: ["AE-"] },
    AssignMessage: { indications: ["AM-"] },
    BasicAuthentication: {indications: ["BA-"] },
    ExtractVariables: { indications: ["EV-"] },
    FlowCallout: { indications: ["FC-"] }, 
    GenerateSAMLAssertion: { indications: ["SA-"] },
    GetOAuthV1Info:{indications: ["OA-"]},
    GetOAuthV2Info: {indications: ["OA-"]},
    InvalidateCache: {indications: ["CI-"] },
    JSONThreatProtection: {indications: ["JT-"] },
    JSONToXML: { indications: ["JX-"] },
    JavaCallout: { indications: ["JC-"] },
    Javascript: { indications: ["JS-"] }, 
    KeyValueMapOperations: {indications: ["KV-"] },
    Ldap: { indications: ["LD-"] },
    LookupCache: { indications: ["CL-"] }, 
    MessageLogging: { indications: ["ML-"] }, 
    MessageValidation: { indications: ["MV-"] },
    OAuthV1: {indications: ["OA-"]},
    OAuthV2: {indications: ["OA-"]},
    PopulateCache: {indications: ["CP-"] },
    Quota: { indications: ["QU-"] },
    RaiseFault: { indications: ["RF-"] },
    RegularExpressionProtection: { indications: ["RE-"] },
    ResetQuota: { indications: ["QR-"] },
    ResponseCache: { indications: ["RC-"] },
    Script: { indications: ["PY-"] },
    ServiceCallout: { indications: ["SC-"] },
    SpikeArrest: { indications: ["SA-"] },
    StatisticsCollector: { indications: ["SC-"] },
    VerifyAPIKey: { indications: ["VK-"] },
    XMLThreatProtection: { indications: ["XT-"] },
    XMLToJSON: { indications: ["XJ-"] },
    XSL: { indications: ["XS-"] },
    "": { indications: [] }
  };

var onPolicy = function(policy, cb) {
  var displayName = policy.getDisplayName(),
    policyType = policy.getType(),
    prefixes = policyMetaData[policyType].indications,
    found = false,
    hadWarn = false;

  prefixes.some(function(prefix) {
    if (displayName.startsWith(prefix)) {
      found = true;
      return;
    }
  });

  if (!found || displayName === "") {
    policy.addMessage({
      plugin,
      message:
        'Naming Conventions: Policy "' +
        displayName +
        '" of type "' +
        policyType +
        '" should have an indicative prefix. Valid prefixes include: ' +
        JSON.stringify(prefixes)
    });
    hadWarn = true;
  }
  if (typeof cb == "function") {
    cb(null, hadWarn);
  }
};

module.exports = {
  plugin,
  onPolicy
};
