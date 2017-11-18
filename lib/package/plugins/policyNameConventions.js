//checkFileName.js

var plugin = {
    ruleId: "PO007",
    name: "Policy Naming Conventions - type indication",
    message:
      "It is recommended that the policy name include an indicator of the policy type.",
    fatal: false,
    severity: 1, //warning
    nodeType: "Policy",
    enabled: true
  },
  policyMetaData = {
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
      indications: ["encode", "basicauth", "ba", "auth"]
    },
    InvalidateCache: {
      indications: ["invalidatecache", "invalidate", "ic", "cache"]
    },
    LookupCache: { indications: ["lookup", "lu", "lucache", "cache", "lc"] },
    PopulateCache: {
      indications: ["populate", "pop", "populatecache", "pc", "cache"]
    },
    ResponseCache: { indications: ["responsecache", "rc", "cache"] },
    ExtractVariables: { indications: ["extract", "ev", "vars"] },
    FlowCallout: { indications: ["flowcallout", "flow", "fc"] },
    JavaCallout: { indications: ["javacallout", "java", "javac"] },
    Javascript: { indications: ["jsc", "js", "javascript"] },
    JSONThreatProtection: {
      indications: ["jsonthreat", "threat", "jtp", "tp"]
    },
    JSONToXML: { indications: ["jsontoxml", "j2x", "jtox"] },
    KeyValueMapOperations: {
      indications: ["keyvaluemapoperations", "kvm", "kvmops"]
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
    RaiseFault: { indications: ["raisefault", "rf", "fault"] },
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

var onPolicy = function(policy, cb) {
  var displayName = policy.getDisplayName(),
    policyType = policy.getType(),
    prefixes = policyMetaData[policyType].indications,
    found = false,
    hadWarn = false;

  prefixes.some(function(prefix) {
    if (displayName.toLowerCase().startsWith(prefix)) {
      found = true;
      return;
    }
  });

  if (!found || displayName === "") {
    policy.addMessage({
      plugin,
      message:
        'Policy "' +
        displayName +
        '" of type "' +
        policyType +
        '" should have an indicative prefix. Typical prefixes include: ' +
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
