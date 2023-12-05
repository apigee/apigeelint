// These are the error messages only for the failed policies.
module.exports = {
  "EV-Type-foo.xml":
    "JSONPayload/Variable/@type is (foo), must be one of boolean,double,float,integer,long,nodeset,string",
  "EV-Type-String-should-be-lowercase.xml":
    "JSONPayload/Variable/@type is (String), must be one of boolean,double,float,integer,long,nodeset,string",
  "EV-Multiple-JSONPayload.xml":
    "Policy has multiple JSONPayload elements. You should have a maximum of one.",
  "EV-Missing-Variable.xml":
    "JSONPayload element exists but there is no Variable element.",
  "EV-XML-bool.xml":
    "XMLPayload/Variable/@type is (bool), must be one of boolean,double,float,integer,long,nodeset,string",
  "EV-URIPath-with-lowercase-pattern-element.xml":
    "Unexpected element 'pattern' as child of URIPath.",
  "EV-Variable-with-no-Pattern.xml":
    "There should be at least one Pattern element as child of Variable."
};
