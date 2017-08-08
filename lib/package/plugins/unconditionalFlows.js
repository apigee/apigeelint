//unconditionalFlows.js

var plugin = {
    ruleId: "FL001",
    name: "Unconditional Flows",
    message:
      "Only one unconditional flow will be executed.  Error if more than one detected.",
    fatal: true,
    severity: 2, //error
    nodeType: "Endpoint",
    enabled: true
  },
  lastFlow, hadWarning=false;

var searchUnconditionalFlowsInEndpoint = function(endpoint) {
  var unconditionalFlows = 0;
  endpoint.getFlows() &&
    endpoint.getFlows().forEach(function(fl) {
      if (!fl.getCondition() || fl.getCondition().getExpression() === "") {
        unconditionalFlows++;
        lastFlow = fl;
      }
    });

  if (unconditionalFlows > 0) {
    hadWarning=true;
    endpoint.addMessage({
      source: lastFlow.getSource(),
      line: lastFlow.getElement().lineNumber,
      column: lastFlow.getElement().columnNumber,
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

var onProxyEndpoint = function(endpoint,cb) {
  searchUnconditionalFlowsInEndpoint(endpoint);
  if (typeof cb == "function") {
    cb(hadWarning);
  }
};

var onTargetEndpoint = function(endpoint,cb) {
  searchUnconditionalFlowsInEndpoint(endpoint);
  if (typeof cb == "function") {
    cb(hadWarning);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
