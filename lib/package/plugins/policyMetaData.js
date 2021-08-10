// policyMetaData.js
// ------------------------------------------------------------------
//
// created: Tue Aug 10 14:23:03 2021
// last saved: <2021-August-10 14:23:34>

/* jshint esversion:9, node:true, strict:implied */
/* global process, console, Buffer */

const policyMetaData = {
    AccessControl: { indications: ["accesscontrol", "ac", "accessc"] },
    AccessEntity: { indications: ["accessentity", "ae", "accesse"] },
    AssignMessage: {
      indications: [
        "assign",
        "build",
        "am",
        "assignmessage",
        "set",
        "response",
        "send",
        "add"
      ]
    },
    BasicAuthentication: {
      indications: ["encode", "decode", "basicauth", "ba", "auth"]
    },
    InvalidateCache: {
      indications: ["invalidatecache", "invalidate", "ic", "cache"]
    },
    LookupCache: { indications: ["lookup", "lu", "lucache", "cache", "lc"] },
    PopulateCache: {
      indications: ["populate", "pop", "populatecache", "pc", "cache"]
    },
    ResponseCache: { indications: ["responsecache", "rc", "cache"] },
    HMAC: { indications: ["hmac"] },
    ExternalCallout: { indications: ["externalcallout", "ec", "extc", "external"], profiles:['apigeex'] },
    ExtractVariables: { indications: ["extractvariables", "extract", "ev", "vars"] },
    FlowCallout: { indications: ["flowcallout", "flow", "fc"] },
    JavaCallout: { indications: ["javacallout", "java", "javac"] },
    Javascript: { indications: ["jsc", "js", "javascript"] },
    JSONThreatProtection: {
      indications: ["jsonthreat", "threat", "jtp", "tp"]
    },
    JSONToXML: { indications: ["jsontoxml", "j2x", "jtox"] },
    KeyValueMapOperations: {
      indications: ["keyvaluemapoperations", "kv", "kvm", "kvmops"]
    },
    Ldap: { indications: ["ldap"] },
    MessageLogging: { indications: ["messagelogging", "logging", "ml"] },
    MessageValidation: { indications: ["messagevalidation", "mv", "messval"] },
    OAuthV1: {
      indications: ["oauthv1", "oauth", "oa", "accesstoken", "verify"]
    },
    OAuthV2: {
      indications: ["oauthv2", "oauth", "oa", "accesstoken", "verify"]
    },
    GetOAuthV2Info: {
      indications: ["oauthv2info", "oauthinfo", "oai", "accesstoken"]
    },
    VerifyAPIKey: { indications: ["verifyapikey", "apikey", "va", "verify"] },
    SpikeArrest: { indications: ["spikearrest", "spike", "sa"] },
    RaiseFault: { indications: ["raisefault", "rf", "raise", "fault"] },
    RegularExpressionProtection: { indications: ["regex", "re", "tp"] },
    GenerateSAMLAssertion: { indications: ["saml", "sa"] },
    Quota: { indications: ["quota", "q"] },
    Script: { indications: ["script", "scr"] },
    ServiceCallout: { indications: ["callout", "sc"] },
    StatisticsCollector: { indications: ["stats", "statcoll"] },
    XMLThreatProtection: { indications: ["xmltp", "tp"] },
    XMLToJSON: { indications: ["xmltojson", "x2j"] },
    XSL: { indications: ["xsl"] },
    GetOAuthV1Info:{indications: ["oauthv1", "getoauth", "getoa"]},
    "": { indications: [] }
  };

module.exports = policyMetaData;
