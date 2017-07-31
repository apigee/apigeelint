var plugin = {
  ruleId: "ST001",
  name: "Empty Steps",
  message: "Empty steps clutter a bundle. Performance is not degraded.",
  fatal: false,
  severity: 1, //warn
  nodeType: "Step",
  enabled: true
};

var onStep = function(step, cb) {
  var hadWarn = false;

  if (step.getName() === "") {
    step.addMessage({
      plugin,
      message: "Step name is empty."
    });
    hadWarn = true;
  }
  if (typeof(cb) == 'function') {
    cb(hadWarn);
  }
};

module.exports = {
  plugin,
  onStep
};
