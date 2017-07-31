//checkFileName.js

var plugin = {
  ruleId: "PO008",
  name: "Check File and Display Naming",
  message: "Check that file names correspond to policy display names.",
  fatal: false,
  severity: 1, //warning
  nodeType: "Policy",
  enabled: true
};

var onPolicy = function(policy, cb) {
  var fname = policy.getFileName().split(".xml")[0],
    hadWarn = false;

  if (fname !== policy.getDisplayName()) {
    policy.addMessage({
      plugin,
      message:
        'Filename "' +
        policy.getName() +
        '" does not match policy display name "' +
        policy.getDisplayName() +
        '". To avoid confusion when working online and offline use the same name for files and display name in policies (excluding .xml extension).'
    });
    hadWarn = true;
  }
  if (typeof(cb) == 'function') {
    cb(hadWarn);
  }
};

module.exports = {
  plugin,
  onPolicy
};
