//checkRegexLookAround
//PO018 | Regex Lookahead/Lookbehind are Expensive - Threat Protection Policy

var plugin = {
    ruleId: "BN003",
    name: "Regular Expression Lookarounds",
    message:
      "Regex Lookahead/Lookbehind are expensive, especially when applied to large text blocks, consider refactoring to a simpler regular expression.",
    fatal: false,
    severity: 2, //warn
    nodeType: "RegularExpressionProtection",
    enabled: true
  },
  xpath = require("xpath");

//need to check http://docs.apigee.com/api-services/reference/regular-expression-protection

var onPolicy = function(policy) {
  var hadWarn = false;

  if (policy.getType() === "RegularExpressionProtection") {
    var patterns = xpath.select(".//Pattern/text()", policy.getElement());
    patterns.forEach(function(pattern) {
      if (pattern.data.includes("(?")) {
        //if the pattern includes ($
        policy.addMessage({
          plugin,
          line: pattern.lineNumber,
          column: pattern.columnNumber,
          source: pattern.data,
          message: "Lookaround in Regex can be inefficient."
        });
        hadWarn = true;
      }
    });
  }

  return hadWarn;
};

//and conditions http://docs.apigee.com/api-services/content/pattern-matching-conditional-statements

module.exports = {
  plugin,
  onPolicy
};
