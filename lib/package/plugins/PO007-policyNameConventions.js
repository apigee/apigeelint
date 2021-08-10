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
        name: "Policy Naming Conventions - type indication",
        message:
        "It is recommended that the policy name include an indicator of the policy type.",
        fatal: false,
        severity: 1, //warning
        nodeType: "Policy",
        enabled: true
      },
      debug = require("debug")("apigeelint:" + ruleId),
      policyMetaData = {
        "" :{"indications":[]},
        AccessControl :{"indications":["accesscontrol","ac","accessc"]},
        AccessEntity :{"indications":["accessentity","ae","accesse"]},
        AssignMessage :{"indications":["assign","build","am","assignmessage","set","response","send","add"]},
        BasicAuthentication :{"indications":["encode","decode","basicauth","ba","auth"]},
        CORS :{"indications":["cors"]},
        ExtractVariables :{"indications":["extractvariables","extract","ev","vars"]},
        FlowCallout :{"indications":["flowcallout","flow","fc"]},
        GenerateSAMLAssertion :{"indications":["saml","sa"]},
        GetOAuthV1Info :{"indications":["oauthv1","getoauth","getoa"]},
        GetOAuthV2Info :{"indications":["oauthv2info","oauthinfo","oai","accesstoken"]},
        InvalidateCache :{"indications":["invalidatecache","invalidate","ic","cache"]},
        JSONThreatProtection :{"indications":["jsonthreat","threat","jtp","tp"]},
        JSONToXML :{"indications":["jsontoxml","j2x","jtox"]},
        JavaCallout :{"indications":["javacallout","java","javac"]},
        Javascript :{"indications":["jsc","js","javascript"]},
        KeyValueMapOperations :{"indications":["keyvaluemapoperations","kv","kvm","kvmops"]},
        Ldap :{"indications":["ldap"]},
        LookupCache :{"indications":["lookup","lu","lucache","cache","lc"]},
        MessageLogging :{"indications":["messagelogging","logging","ml"]},
        MessageValidation :{"indications":["messagevalidation","mv","messval"]},
        OAuthV1 :{"indications":["oauthv1","oauth","oa","accesstoken","verify"]},
        OAuthV2 :{"indications":["oauthv2","oauth","oa","accesstoken","verify"]},
        PopulateCache :{"indications":["populate","pop","populatecache","pc","cache"]},
        Quota :{"indications":["quota","q"]},
        RaiseFault :{"indications":["raisefault","rf","raise","fault"]},
        RegularExpressionProtection :{"indications":["regex","re","tp"]},
        ResponseCache :{"indications":["responsecache","rc","cache"]},
        Script :{"indications":["script","scr"]},
        ServiceCallout :{"indications":["callout","sc"]},
        SpikeArrest :{"indications":["spikearrest","spike","sa"]},
        StatisticsCollector :{"indications":["stats","statcoll"]},
        VerifyAPIKey :{"indications":["verifyapikey","apikey","va","verify"]},
        XMLThreatProtection :{"indications":["xmltp","tp"]},
        XMLToJSON :{"indications":["xmltojson","x2j"]},
        XSL :{"indications":["xsl"]}
      };
const onPolicy = function(policy, cb) {
        let policyName = policy.getName(),
            policyType = policy.getType(),
            prefixes = policyMetaData[policyType].indications,
            flagged = false;

        if ( ! policyName) {
          policy.addMessage({
            plugin,
            message: `No name found for policy`
          });
          flagged = true;
        }
        else {
          debug(`policyName(${policyName})`);
          let match = (new RegExp('^([A-Za-z0-9]{1,})[-.](.+)$')).exec(policyName),
              policyPrefix = match && match[1];
          debug(`prefix(${policyPrefix})`);
          if ( !policyPrefix || !prefixes.some(prefix => policyPrefix.toLowerCase() == prefix )) {
            let nameAttr = policy.select('//@name');
            policy.addMessage({
              plugin,
              line: nameAttr[0].lineNumber,
              column: nameAttr[0].columnNumber,
              message:
              `Non-standard prefix (${policyPrefix}). Valid prefixes for ${policyType} include: ` +
                JSON.stringify(prefixes)
            });
            flagged = true;
          }
          if (typeof cb == "function") {
            cb(null, flagged);
          }
        }
      };

module.exports = {
  plugin,
  onPolicy
};
