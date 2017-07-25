var plugin = {
    ruleId: "CC004",
    name: "Overly Complex Condition",
    message:
      "Condition complexity should be limited to a relatively modest number of variables, constants, and comparators.",
    fatal: false,
    severity: 2, //warning
    nodeType: "Condition",
    enabled: true
  },
  threshold = 12;

var onCondition = function(condition) {
  var ast = condition.getTruthTable().getAST(),
    nodeCount = 0,
    nodes = [ast];

  while (nodes[0]) {
    var node = nodes.pop();
    if (node.action !== "substitution") {
      nodeCount++;
    }

    if (node.args) {
      Array.prototype.push.apply(nodes, node.args);
    }
  }

  if (nodeCount > threshold) {
    condition.addMessage({
      plugin,
      message:
        "Condition contains a high number of terms variables, constants, and comparators (" +
        nodeCount +
        ")."
    });
  }

  return nodeCount;
};

module.exports = {
  plugin,
  onCondition
};
