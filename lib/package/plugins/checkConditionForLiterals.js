//checkConditionLength.js

var plugin = {
  ruleId: "CC001",
  name: "Literals in Conditionals",
  message:
    "Single term literals statically evaluate to True or False and needlessly complicate a conditional at best, at worst they create dead code or are misleading in implying condtional execution.",
  fatal: false,
  severity: 2, //warning
  nodeType: "Condition",
  enabled: true
};

var onCondition = function(condition) {
  var ast = condition.getAST(),
    hasLiteral = false,
    nodes = [ast],
    actions = ["root"];

  while (nodes[0] && !hasLiteral) {
    var node = nodes.pop(),
      parentAction = actions.pop();

    if (
      node.type === "constant" &&
      (!parentAction ||
        parentAction.match(
          /^(root|conjunction|disjunction|negation|implication)$/
        ))
    ) {
      hasLiteral = true;
      //write error

      condition.addMessage({
        plugin,
        message: "Condition contains literal outside of comparator."
      });
    } else if (node.args) {
      actions.push(node.action);
      Array.prototype.push.apply(nodes, node.args);
    }
  }

  return hasLiteral;
};

module.exports = {
  plugin,
  onCondition
};

//CC001 | Literals in Conditionals
