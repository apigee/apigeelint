// These are the error or warning messages only for the policies that will get
// flagged, in the Apigee profile.
//
// The value of each key can be:
//  - a single item, either a string or an object
//  - an array of strings or objects.
//
// If a bare string, no severity is indicated, it defaults to 2.
//

module.exports = {
  "EV-JSON-4.xml": [
    {
      severity: 1,
      message:
        "JSONPath ($.store.book[0].[author) does not compile, may be invalid (Error: Parse error on line 1",
    },
    {
      severity: 1,
      message:
        "JSONPath ($.store.book[0].[]author) does not compile, may be invalid (Error: Parse error on line 1",
    },
  ],
  "EV-JSON-5.xml": "JSONPath is empty",
  "EV-JSON-6.xml": {
    severity: 1,
    message:
      "JSONPath ($.quota.[*].appname..) does not compile, may be invalid (Error: Parse error on line 1",
  },
  "EV-JSON-7.xml": {
    severity: 1,
    message:
      "JSONPath ($.selected-index) does not compile, may be invalid (Error: ",
  },
  "EV-JSONPayload-curlies-unbalanced.xml": [
    "JSONPath '$.{foo' uses unbalanced or invalid curly braces: unclosed curly",
  ],
  "EV-JSONPayload-curlies-invalid.xml": [
    "JSONPath '$.}foo' uses unbalanced or invalid curly braces: unexpected close curly",
  ],
};
