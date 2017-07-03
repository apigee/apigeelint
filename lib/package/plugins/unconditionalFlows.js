//unconditionalFlows.js

var plugin = {
  ruleId: "ST001",
  name: "Unconditional Flows",
  message:
    "Only one unconditional flow will be executed.  Error if more than one detected.",
  fatal: true,
  severity: 2, //error
  nodeType: "Endpoint"
};

var searchUnconditionalFlowsInEndpoint = function(endpoint) {
  var unconditionalFlows = 0;
  endpoint.getFlows() &&
    endpoint.getFlows().forEach(function(fl) {
      if (!fl.getCondition() || fl.getCondition().getExpression() === "") {
        unconditionalFlows++;
      }
    });

  if (unconditionalFlows > 0) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: endpoint.getSource(),
      line: endpoint.getElement().lineNumber,
      column: endpoint.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message:
        "Endpoint " +
        endpoint.getProxyName() +
        " has too many uncondtional flows (" +
        unconditionalFlows +
        ").  Only one will be executed."
    };
    endpoint.addMessage(result);
  }
};

// TODO: expand to include RouteRules conditions when that is implemented

var onProxyEndpoint = function(endpoint) {
  return searchUnconditionalFlowsInEndpoint(endpoint);
};

var onTargetEndpoint = function(endpoint) {
  return searchUnconditionalFlowsInEndpoint(endpoint);
};

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
