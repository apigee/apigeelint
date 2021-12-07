/*
  Copyright 2019-2021 Google LLC

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

const plugin = {
    ruleId: "EX-PO007",
    name: "Policy Naming Conventions - type indication",
    message:
      "It is recommended that the policy name include an indicator of the policy type.",
    fatal: false,
    severity: 1, //warning
    nodeType: "Policy",
    enabled: true
  },
  policyPrefixes = {
    AccessControl: ["AC-"] ,
    AccessEntity: ["AE-"] ,
    AssignMessage: ["AM-"] ,
    BasicAuthentication: ["BA-"] ,
    ExtractVariables: ["EV-"] ,
    FlowCallout: ["FC-"] ,
    GenerateSAMLAssertion: ["SA-"] ,
    GetOAuthV1Info: ["OA-"],
    GetOAuthV2Info: ["OA-"],
    InvalidateCache: ["CI-"] ,
    JSONThreatProtection: ["JT-"] ,
    JSONToXML: ["JX-"] ,
    JavaCallout: ["JC-"] ,
    Javascript: ["JS-"] ,
    KeyValueMapOperations: ["KV-"] ,
    Ldap: ["LD-"] ,
    LookupCache: ["CL-"] ,
    MessageLogging: ["ML-"] ,
    MessageValidation: ["MV-"] ,
    OAuthV1: ["OA-"],
    OAuthV2: ["OA-"],
    PopulateCache: ["CP-"] ,
    Quota: ["QU-"] ,
    RaiseFault: ["RF-"] ,
    RegularExpressionProtection: ["RE-"] ,
    ResetQuota: ["QR-"] ,
    ResponseCache: ["RC-"] ,
    Script: ["PY-"] ,
    ServiceCallout: ["SC-"] ,
    SpikeArrest: ["SA-"] ,
    StatisticsCollector: ["SC-"] ,
    VerifyAPIKey: ["VK-"] ,
    XMLThreatProtection: ["XT-"] ,
    XMLToJSON: ["XJ-"] ,
    XSL: ["XS-"] ,
    "": []
  };

const onPolicy = function(policy, cb) {
  let policyName = policy.getName(),
      policyType = policy.getType(),
      prefixes = policyPrefixes[policyType],
      flagged = false;
      if (prefixes) {
        let found = prefixes.some(prefix =>
                                  policyName.startsWith(prefix));
        if (!found || policyName === "") {
          policy.addMessage({
            plugin,
            message:
            `Naming Conventions: Policy "${policyName}" of type "${policyType}" should have an indicative prefix. Valid prefixes include: ` +
              JSON.stringify(prefixes)
          });
          flagged = true;
        }
      }
      if (typeof cb == "function") {
        cb(null, flagged);
      }
    };

module.exports = {
  plugin,
  onPolicy
};
