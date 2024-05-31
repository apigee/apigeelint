const plugin = {
  ruleId: "EX-001",
  name: "Streaming",
  message: "Check for policies while streaming is enabled",
  fatal: false,
  severity: 2, // 1 = warn, 2 = error
  nodeType: "Bundle",
  enabled: true
};

const onBundle = function(bundle, cb) {
  let hadWarnErr=false, isProxyStreamingEnabled=false, isTargetStreamingEnabled=false;
  const proxies = bundle.getProxyEndpoints();
  proxies.forEach((proxyEndpoint, _p) => {
    const httpProxyConnection = proxyEndpoint.getHTTPProxyConnection();
    if(httpProxyConnection){
      let properties = httpProxyConnection.getProperties();
      if(properties!=null && (properties["request.streaming.enabled"]=="true" || properties["response.streaming.enabled"]=="true")){
        isProxyStreamingEnabled = true;
      }
    }
  });
  const targets = bundle.getTargetEndpoints();
  targets.forEach((targetEndpoint, _t) => {
    const httpTargetConnection = targetEndpoint.getHTTPTargetConnection();
    if(httpTargetConnection){
      let properties = httpTargetConnection.getProperties();
      if(properties!=null && (properties["request.streaming.enabled"]=="true" || properties["response.streaming.enabled"]=="true")){
        isTargetStreamingEnabled = true;
      }
    }
  });

  if(isProxyStreamingEnabled || isTargetStreamingEnabled){
    bundle.getPolicies().forEach(function(policy) {
      if ((policy.getType() === "AssignMessage" || policy.getType() === "ExtractVariables") && policy.getSteps().length > 0) {
        bundle.addMessage({
          plugin,
          source: policy.getSource(),
          line: policy.getElement().lineNumber,
          column: policy.getElement().columnNumber,
          message: "ExtractVariables/AssignMessage policies not allowed when streaming is enabled"
        });
        hadWarnErr = true;
      }
    });
  }
};

module.exports = {
  plugin,
  onBundle
};