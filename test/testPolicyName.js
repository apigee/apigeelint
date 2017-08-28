var assert = require("assert"),
  debug = require("debug")("bundlelinter:flowNames");

var Policy = require("../lib/package/Policy.js"),
  Dom = require("xmldom").DOMParser,
  test = function(exp, assertion) {
    it("testing policy names ", function() {
      //function Policy(path, fn, parent)
      var doc = new Dom().parseFromString(exp),
        policy = new Policy("no-file-path", "somepolicy.xml", this);

      policy.getElement = function() {
        return doc;
      };

      result = policy.getDisplayName();

      assert.deepEqual(
        result,
        assertion,
        result ? "names did not match" : "names matched"
      );
    });
  };

test(
  `<Javascript name='JS-Log-To-Stackdriver' timeLimit='400'>
<Properties>
  <Property name='authz_header'>Bearer {stackdriver.token}</Property>
  <Property name='payload'>{
"logName": "projects/{stackdriver.projectid}/logs/{stackdriver.logid}",
"resource" : {
  "type": "api",
  "labels": {}
},
"labels": {
    "flavor": "test"
},
"entries": [{
    "severity" : "INFO",
    "textPayload" : "{stackdriver.logpayload}"
   }
],
"partialSuccess": true
}</Property>
  <Property name='endpoint'>https://logging.googleapis.com/v2/entries:write</Property>
</Properties>
<ResourceURL>jsc://log-To-Stackdriver.js</ResourceURL>
</Javascript>
`,
  "JS-Log-To-Stackdriver"
);
