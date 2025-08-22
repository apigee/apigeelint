// These are the error messages only for the policies that will get flagged, in the Apigee profile.

module.exports = {
  "EV-JSON-4.xml": [
    "JSONPath ($.store.book[0].[author) is invalid (Error: Parse error on line 1",
    "JSONPath ($.store.book[0].[]author) is invalid (Error: Parse error on line 1",
  ],
  "EV-JSON-5.xml": "JSONPath is empty",
  "EV-JSON-6.xml":
    "JSONPath ($.quota.[*].appname..) is invalid (Error: Parse error on line 1",
  "EV-JSONPayload-curlies-unbalanced.xml": [
    "JSONPath '$.{foo' uses unbalanced or invalid curly braces: unclosed curly",
  ],
  "EV-JSONPayload-curlies-invalid.xml": [
    "JSONPath '$.}foo' uses unbalanced or invalid curly braces: unexpected close curly",
  ],
};
