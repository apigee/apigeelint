var assert = require("assert"),
  debug = require("debug")("bundlelinter:flowNames");

var Endpoint = require("../../lib/package/Endpoint.js"),
  Dom = require("xmldom").DOMParser,
  test = function(exp, assertion) {
    it("testing flow conditions ", function() {
      var result = [],
        doc = new Dom().parseFromString(exp),
        ep = new Endpoint(doc, this,"/dummy/test/apiproxy/proxies/foo.xml"),
        flows = ep.getFlows();

      flows.forEach(function(f) {
        result.push(f.getCondition().getExpression());
      });
      assert.deepEqual(
        result,
        assertion,
        result ? "conditions did not match" : "conditions matched"
      );
    });
  };
describe("Testing testFlowConditions.js", function() {
  test(
    `
  <ProxyEndpoint name="default">
  <Flows>
  		<Flow name="condition1">
              <Description>This is condition 1</Description>
              <Request>
                  <Step>
  			<Name>jsCalculate</Name>
                  </Step>
              </Request>
              <Response>
              </Response>
              <Condition>(request.verb = "GET") and (proxy.pathsuffix MatchesPath "/condition1")</Condition>
          </Flow>
  		<Flow name="condition2">
              <Description>This is condition 2</Description>
              <Request>
                  <Step>
  			<Name>jsCalculateFromContext</Name>
                  </Step>
              </Request>
              <Response>
              </Response>
              <Condition>(request.verb = "GET") and (proxy.pathsuffix MatchesPath "/condition2")</Condition>
          </Flow>
    </Flows>
    </ProxyEndpoint>
  `,
    [`(request.verb = "GET") and (proxy.pathsuffix MatchesPath "/condition1")`, `(request.verb = "GET") and (proxy.pathsuffix MatchesPath "/condition2")`]
  );
});
