var plugin = {
    ruleId: "CC004",
    name: "Overly Complex Condition",
    message:
      "Condition complexity should be limited to a relatively modest number of variables, constants, and comparators.",
    fatal: false,
    severity: 1, //warning
    nodeType: "Condition",
    enabled: true
  },
  threshold = 12;

var onCondition = function(condition, cb) {
  condition.getTruthTable().getAST(function(ast) {
    var nodeCount = 0,
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

      if (typeof(cb) == 'function') {
        cb(nodeCount);
      }
    }
    return nodeCount;
  });
};

module.exports = {
  plugin,
  onCondition
};
