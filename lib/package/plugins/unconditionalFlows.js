//unconditionalFlows.js

var plugin = {
  ruleId: "ST001",
  name: "Unconditional Flows",
  message:
    "Only one unconditional flow will be executed.  Error if more than one detected.",
  fatal: true,
  severity: 2, //error
  nodeType: "Endpoint",
  enabled: true
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
    endpoint.addMessage({
      plugin,
      message:
        "Endpoint " +
        endpoint.getProxyName() +
        " has too many uncondtional flows (" +
        unconditionalFlows +
        ").  Only one will be executed."
    });
  }
};

// TODO: expand to include RouteRules conditions when that is implemented

var onProxyEndpoint = function(endpoint) {
  return searchUnconditionalFlowsInEndpoint(endpoint);
  if (typeof(cb) == 'function') {
    cb(hadWarning);
  }
};

var onTargetEndpoint = function(endpoint) {
  return searchUnconditionalFlowsInEndpoint(endpoint);
  if (typeof(cb) == 'function') {
    cb(hadWarning);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
