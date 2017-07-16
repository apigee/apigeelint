var plugin = {
  ruleId: "ST001",
  name: "Empty Steps",
  message: "Empty steps clutter a bundle. Performance is not degraded.",
  fatal: false,
  severity: 1, //warn
  nodeType: "Step",
  enabled: true
};

var onStep = function(step) {
  if (step.getName() === "") {
    var result = {
      plugin,
      message: "Step name is empty."
    };
    step.addMessage(result);
  }
};

module.exports = {
  plugin,
  onStep
};
