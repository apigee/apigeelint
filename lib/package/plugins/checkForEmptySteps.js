var plugin = {
    ruleId: "ST001",
    name: "Empty Steps",
    message: "Empty steps clutter a bundle. Performance is not degraded.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Step"
  };

var onStep = function(step) {
  if (step.getName() === "") {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: step.getSource(),
      line: step.getElement().lineNumber,
      column: step.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message: "Step name is empty."
    };
    step.addMessage(result);
  }
};

module.exports = {
  plugin,
  onStep
};
