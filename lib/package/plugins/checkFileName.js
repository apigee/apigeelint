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

var onPolicy = function(policy) {
  var fname = policy.getFileName().split(".xml")[0];

  if (fname !== policy.getDisplayName()) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: policy.getSource(),
      line: policy.getElement().lineNumber,
      column: policy.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message:
        'Filename "' +
        policy.getName() +
        '" does not match policy display name "' +
        policy.getDisplayName() +
        '". To avoid confusion when working online and offline use the same name for files and display name in policies (excluding .xml extension).'
    };
    policy.addMessage(result);
  }
};

module.exports = {
  plugin,
  onPolicy
};
