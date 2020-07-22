var plugin = {
    ruleId: "P020",
    name: "Check if the Spike Arrest policy is being used in the PreFlow section",
    message: "Spike Arrest policy should be included in the PreFlow section.",
    fatal: false,
    severity: 2, //error
    nodeType: "ProxyEndpoint",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onProxyEndpoint = function(ep, cb) {
  var hadError = false,
    spikeArrestFound = false;
  
  if (ep.getPreFlow()) {
    var steps = ep.getPreFlow().getFlowRequest().getSteps();
    steps.forEach(function(step) {
      if (step.getName() && ep.getParent().getPolicies()) {
        var p = ep.getParent().getPolicyByName(step.getName());
        if (p.getType() === "SpikeArrest") {
          spikeArrestFound = true;
        }
      }
    });
  }
  
  if (!spikeArrestFound) {
    ep.addMessage({
      plugin,
      message: plugin.message
    });
    hadError = true;
  }

  if (typeof(cb) == 'function') {
    cb(null, hadError);
  }
};

module.exports = {
  plugin,
  onProxyEndpoint
};