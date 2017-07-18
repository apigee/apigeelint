//Condition.js

function Condition(element, parent) {
  this.parent = parent;
  this.element = element;
}

Condition.prototype.getExpression = function() {
  return (
    (this.element.childNodes &&
      this.element.childNodes[0] &&
      this.element.childNodes[0].nodeValue) ||
    ""
  );
};

Condition.prototype.getMessages = function() {
  return this.parent.getMessages();
};

Condition.prototype.getElement = function() {
  return this.element;
};

Condition.prototype.getParent = function() {
  return this.parent;
};

Condition.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

Condition.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop = this.element.nextSibling.lineNumber - 1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

Condition.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

Condition.prototype.onConditions = function(pluginFunction) {
  pluginFunction(this);
};

Condition.prototype.summarize = function() {
  var summary = {};
  summary.condition = this.getExpression();
  summary.validity = this.getTruthTable().evaluation;
  return summary;
};

Condition.prototype.getVals = function(varName) {
  var vals = {},
    vName,
    vVal;
  function process(a) {
    for (var i = 0; i < a.length; i++) {
      //look down the args to see if we have a substitution
      if (a[i].args) {
        //is this a substitution node?
        if (a[i].args[0].action && a[i].args[0].action === "substitution") {
          //this only works for right or left hand vars
          if (
            a[i].args[0].args[0].type === "variable" &&
            a[i].args[1].args[0].type === "constant"
          ) {
            vName = a[i].args[0].args[0].value;
            vVal = a[i].args[1].args[0].value;
            if (!vals[vName]) {
              vals[vName] = [];
            }
            //add check to see if already contains
            vals[vName].push(vVal);
          } else if (
            a[i].args[1].args[0].type === "variable" &&
            a[i].args[0].args[0].type === "constant"
          ) {
            vName = a[i].args[1].args[0].value;
            vVal = a[i].args[0].args[0].value;
            if (!vals[vName]) {
              vals[vName] = [];
            }
            //add check to see if already contains
            vals[vName].push(vVal);
          }
        } else {
          process(a[i].args);
        }
      }
    }
  }
  if (!this.vals) {
    process([this.getAST()]);
    this.vals = vals;
  }
  if (varName) {
    return this.vals[varName];
  }
  return this.vals;
};

function interpret(tree, substitutions, condition) {
  if (!tree) return;
  var iTree = JSON.parse(JSON.stringify(tree)),
    evaluations = [];

  function parseArgs(args) {
    var varValue, consValue, index, vals;
    if (args.length === 1) {
      varValue = args[0].evaluation.value;
    } else {
      varValue = args[0].evaluation.value;
      consValue = args[1].evaluation.expressionValue;
      if (
        args[0].evaluation.type === "variable" &&
        args[1].evaluation.type === "constant"
      ) {
        (index = args[0].evaluation.value ? 0 : 1), (vals = condition.getVals(
          args[0].evaluation.expressionValue
        ));
        if (vals && index <= vals.length) {
          varValue = vals[index];
        } else {
          varValue = args[0].evaluation.value;
        }
        consValue = args[1].evaluation.expressionValue;
      } else if (
        args[1].evaluation.type === "variable" &&
        args[0].evaluation.type === "constant"
      ) {
        (index = args[1].evaluation.value ? 0 : 1), (vals = condition.getVals(
          args[1].evaluation.expressionValue
        ));
        if (vals && index <= vals.length) {
          varValue = vals[index];
        } else {
          varValue = args[1].evaluation.value;
        }
        consValue = args[0].evaluation.expressionValue;
      }
    }
    //strip any leading or trailing quote marks
    if (varValue && varValue.startsWith && varValue.startsWith('"')) {
      varValue = varValue.substring(1);
    }
    if (varValue && varValue.startsWith && varValue.endsWith('"')) {
      varValue = varValue.substring(0, varValue.length - 1);
    }
    if (consValue && consValue.startsWith && consValue.startsWith('"')) {
      consValue = consValue.substring(1);
    }
    if (consValue && consValue.startsWith && consValue.endsWith('"')) {
      consValue = consValue.substring(0, consValue.length - 1);
    }
    return { varValue, consValue };
  }

  var actions = {
    substitution(args) {
      var result = {
        action: "substitution",
        value: !!args[0].value,
        type: args[0].type,
        expressionValue: args[0].value,
        substitutions
      };
      if (args[0].type === "variable") {
        result.value = substitutions[args[0].value];
      } else if (args[0].type === "constant") {
        if (
          args[0].value.toUpperCase &&
          args[0].value.toUpperCase() === "FALSE"
        ) {
          result.value = false;
        } else {
          //testing
          //it is possible we have a single term with no substitution
          //if so then eval the arg itself to a value
          if (substitutions.hasOwnProperty(args[0].varName)) {
            result.value = substitutions[args[0].varName];
          } else {
            result.value = !!args[0].value;
          }
        }
      }
      return result;
    },
    negation(args) {
      var result = {
        action: "negation",
        value: !args[0].evaluation.value,
        rh: args[0].evaluation.value
      };
      return result;
    },
    disjunction(args) {
      var result = {
        action: "disjunction",
        value: args[0].evaluation.value || args[1].evaluation.value,
        rh: args[0].evaluation.value,
        lh: args[1].evaluation.value
      };
      return result;
    },
    conjunction(args) {
      var result = {
        action: "conjunction",
        value: args[0].evaluation.value && args[1].evaluation.value,
        rh: args[0].evaluation.value,
        lh: args[1].evaluation.value
      };
      return result;
    },
    implication(args) {
      var result = {
        action: "implication",
        value: !args[0].evaluation.value || args[1].evaluation.value,
        rh: args[0].evaluation.value,
        lh: args[1].evaluation.value
      };
      return result;
    },
    equivalence(args) {
      //|| (!args[0].value && !args[1].value)
      var result = {
        action: "equivalence",
        value: args[0].evaluation.value === args[1].evaluation.value,
        rh: args[0].evaluation.value,
        lh: args[1].evaluation.value
      };
      return result;
    },
    notEquivalence(args) {
      //var pargs = parseArgs(args);
      //var result = { value: (args[0].value && !args[1].value) || (!args[0].value && args[1].value) };
      //var result = { value: (pargs.varValue !== pargs.consValue) };
      var result = {
        action: "notEquivalence",
        value: args[0].evaluation.value !== args[1].evaluation.value,
        rh: args[0].evaluation.value,
        lh: args[1].evaluation.value
      };
      return result;
    },
    startsWith(args) {
      var result;

      if (args[0].type === "variable" && args[1].type === "variable") {
        result = this.equivalence(args);
      } else {
        var pargs = parseArgs(args);
        result = {
          action: "startsWith",
          value: pargs.varValue.startsWith(pargs.consValue),
          rh: pargs.varValue,
          lh: pargs.consValue
        };
      }
      return result;
    }
  };

  function process(node) {
    var action = node.action,
      args = node.args;

    for (var i = 0; i < args.length; i++) {
      if (args[i] && args[i].args) {
        args[i] = process(args[i]);
      }
    }
    if (action.value && action.value === "!") {
      action = "negation";
    } else if (action.value && action.value === "equivalence") {
      action = "equivalence";
    }
    if (!actions[action]) {
      console.error(action);
    }

    node.evaluation = actions[action](args);
    if (node.hasOwnProperty("evaluation")) {
      evaluations.push(node.evaluation);
    }
    return node;
  }

  var result = process(iTree);
  result.evaluations = evaluations;
  return result;
}

function getInitializator(variables) {
  return function() {
    var substitutions = {},
      values = arguments;

    variables.forEach(function(primitive, index) {
      substitutions[primitive.value] = !!values[index];
    });

    return substitutions;
  };
}

function _evaluate(evaluation, tree, vars, condition) {
  var initializator = getInitializator(vars);
  var result = interpret(
    tree,
    initializator.apply(initializator, evaluation),
    condition
  );
  return result;
}

Condition.prototype.getTruthTable = function(cb) {
  if (this.getExpression()) {
    var condition = this;

    function process(tree) {
      var vars = condition.getVariables(),
        combinations = generateCombinations(vars.length),
        truthTable = { expression: condition.getExpression(), evaluations: [] };

      for (var i = 0, count = Math.pow(2, vars.length); i < count; i++) {
        var result = _evaluate(combinations[i], tree, vars, condition);

        var run = {
          substitutions: combinations[i],
          result
        };
        truthTable.evaluations.push(run);
      }
      //based on the values in truth table assess validity
      var trueCount = 0;
      truthTable.evaluations.forEach(function(run) {
        trueCount += 0 + run.result.evaluation.value;
      });
      truthTable.evaluation = trueCount === 0 ? "absurdity" : "valid";
      //consider new evaluation of "unnecessary" when all evaluations are true
      return truthTable;
    }

    if (!this.truthTable) {
      this.truthTable = process(this.getAST());
    }
  }
  if (cb) {
    cb(this.truthTable);
  }
  return this.truthTable;
};

Condition.prototype.getTokens = function() {
  var pointer = 0,
    tokens = [],
    c = "",
    operator = "";

  function _escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  function _encodeWithin(s, f, r, ch) {
    var result = s.split(ch),
      regex = new RegExp(_escapeRegExp(f), "g");

    for (var i = 1; i < result.length; i += 2) {
      result[i] = result[i].replace(regex, r);
    }
    return result.join(ch);
  }

  function encodeQuotedChars(source, find, replace) {
    if (!replace) {
      replace = encodeURI(find);
    }
    var result = _encodeWithin(source, find, replace, '"');
    result = _encodeWithin(result, find, replace, '"');
    return result;
  }

  function replaceAll(s, f, r) {
    var regex = new RegExp(_escapeRegExp(f), "g");
    return s.replace(regex, r);
  }

  function next() {
    //find next space delimited word
    return (c = input[pointer++]);
  }

  function push(type, value) {
    tokens.push({
      type,
      value
    });
  }

  function isWhiteSpace(ch) {
    return /\s/.test(ch);
  }

  function isVariable(ch) {
    return /[A-Za-z_]/.test(ch);
  }

  function isSpecial(ch) {
    //isSpecial is looking for operators
    //this can get confused with some string constants including regex
    if (typeof ch === "string" && ch.startsWith('"')) {
      return false;
    }
    return /[<>\-|&!]/.test(ch);
  }

  function isConstant(ch) {
    if (typeof ch === "string") {
      var up = ch.toUpperCase(ch);
      if (up === "FALSE" || up === "TRUE") {
        return true;
      }
    }
    var regtest = /^[0-9]*$/.test(ch) || /[\"]/.test(ch);
    return regtest;
  }

  function isExpressionBoundary(ch) {
    return /[\(\)]/.test(ch);
  }

  function operatorExists(op) {
    return ["!", "|", "&", "->", "<->", "!!", "=|"].indexOf(op) !== -1;
  }

  function unrecognizedToken(token, position) {
    throw new Error(
      'Unrecognized token "' + token + '" on position ' + position + "!"
    );
  }

  if (!this.tokens) {
    var expression = " " + this.getExpression(); //in case the expression starts with a logical operator
    //scan for open and close quotes
    //a close quote should always be followed by a space
    var closeQuote = true,
      modified = true;
    while (modified) {
      modified = false;
      for (var i = 0, len = expression.length; i < len; i++) {
        if (expression[i] === '"') {
          closeQuote = !closeQuote;
          if (closeQuote) {
            if (i + 1 < expression.length && expression[i + 1] !== " ") {
              expression =
                expression.slice(0, i + 1) + " " + expression.slice(i + 1);
              modified = true;
              break;
            }
          }
        }
      }
    }

    expression = encodeQuotedChars(expression, "%");
    expression = encodeQuotedChars(expression, " ");
    expression = encodeQuotedChars(expression, "!");
    expression = encodeQuotedChars(expression, ":=");
    expression = encodeQuotedChars(expression, "=");
    expression = encodeQuotedChars(expression, ">");
    expression = encodeQuotedChars(expression, "<");
    expression = encodeQuotedChars(expression, "&&");
    expression = encodeQuotedChars(expression, "||");
    expression = encodeQuotedChars(expression, "~/");
    expression = encodeQuotedChars(expression, "~");
    expression = encodeQuotedChars(expression, "|");
    expression = encodeQuotedChars(expression, "\\");
    expression = encodeQuotedChars(expression, "(");
    expression = encodeQuotedChars(expression, ")");
    expression = encodeQuotedChars(expression, "\t");
    expression = encodeQuotedChars(expression, "\n");
    expression = replaceAll(expression, " Not ", " ! ");
    expression = replaceAll(expression, " not ", " ! ");
    expression = replaceAll(expression, " NOT ", " ! ");
    expression = replaceAll(expression, " Equals ", " = ");
    expression = replaceAll(expression, " Is ", " = ");
    expression = replaceAll(expression, " NotEquals ", " != ");
    expression = replaceAll(expression, " NotIs ", " != ");
    expression = replaceAll(expression, " EqualsCaseInsensitive ", " := ");
    expression = replaceAll(expression, " GreaterThan ", " > ");
    expression = replaceAll(expression, " GreaterThanOrEquals ", " >= ");
    expression = replaceAll(expression, " LesserThanOrEquals ", " <= ");
    expression = replaceAll(expression, " LesserThan ", " < ");
    expression = replaceAll(expression, " AND ", " && ");
    expression = replaceAll(expression, " and ", " && ");
    expression = replaceAll(expression, " OR ", " || ");
    expression = replaceAll(expression, " or ", " || ");
    expression = replaceAll(expression, " JavaRegex ", " ~~ ");
    expression = replaceAll(expression, " Matches ", " ~ ");
    expression = replaceAll(expression, " Like ", " ~ ");
    expression = replaceAll(expression, " MatchesPath ", " ~/ ");
    expression = replaceAll(expression, " !MatchesPath ", " !~/ ");

    expression = replaceAll(expression, " LikePath ", " ~/ ");
    expression = replaceAll(expression, " Starts ", " == ");
    //expression = replaceAll(expression, " StartsWith ", " == ");
    expression = replaceAll(expression, " Starts ", " =| ");
    expression = replaceAll(expression, " StartsWith ", " =| ");
    expression = replaceAll(expression, "(", " ( ");
    expression = replaceAll(expression, ")", " ) ");
    expression = replaceAll(expression, "\t", " ");
    expression = replaceAll(expression, "\n", " ");
    expression = expression.trim();
    //expression = replaceAll(expression, "=|", " <-> ");
    expression = replaceAll(expression, "==", " <-> ");
    expression = replaceAll(expression, "!=", " !! ");
    expression = replaceAll(expression, "! =", " !! ");
    expression = replaceAll(expression, "=", " <-> ");
    expression = replaceAll(expression, "<-> |", " =| ");

    expression = replaceAll(expression, ":=", " <-> ");
    expression = replaceAll(expression, "~~", " <-> ");
    expression = replaceAll(expression, "!~/", " !! ");
    expression = replaceAll(expression, "~/", " <-> ");

    expression = replaceAll(expression, "&&", " & ");
    expression = replaceAll(expression, "||", " | ");
    expression = replaceAll(expression, "%", "x");
    expression = replaceAll(expression, "!", " ! ");
    expression = replaceAll(expression, " !  ! ", " !! ");
    //remove duplicate spaces
    while (expression.indexOf("  ") >= 0) {
      expression = replaceAll(expression, "  ", " ");
    }
    expression = expression.trim();

    var input = expression.split(" ");
    try {
      while (next()) {
        if (isSpecial(c)) {
          operator += c;
          if (operatorExists(operator)) {
            push("operator", operator);
            operator = "";
          }
        } else {
          if (operator.length) {
            unrecognizedToken(operator, pointer - operator.length - 1);
          }
          if (isWhiteSpace(c)) {
            continue;
          } else if (isExpressionBoundary(c)) {
            push("boundary", c);
          } else if (isConstant(c)) {
            push("constant", c);
          } else if (isVariable(c)) {
            push("variable", c);
          } else {
            unrecognizedToken(c, pointer - 2);
          }
        }
      }
    } catch (e) {
      console.error(e);
      //TODO: Figure out why a condition NOT(foo="bar") fails lexing
      //throw new Error('Lex error on "' + input + '"');
    }
    this.tokens = tokens;
  }
  return this.tokens;
};

function containsToken(a, obj) {
  var i = a.length;
  while (i--) {
    if (a[i].value === obj.value) {
      return true;
    }
  }
  return false;
}

function getTokensByType(tokens, type) {
  var result = [];
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].type === type && !containsToken(result, tokens[i])) {
      result.push(tokens[i]);
    }
  }
  result
    .sort(function(a, b) {
      return a.value > b.value ? 1 : -1;
    })
    .filter(function(item, index, arr) {
      return arr.indexOf(item) === index;
    });
  return result;
}

Condition.prototype.getVariables = function() {
  if (!this.variables) {
    this.variables = getTokensByType(this.getTokens(), "variable");
  }
  return this.variables;
};

Condition.prototype.getConstants = function() {
  if (!this.constants) {
    this.constants = getTokensByType(this.getTokens(), "constant");
  }
  return this.constants;
};

Condition.prototype.getAST = function(cb) {
  function processAST(tokens) {
    var translate = {
      //highest precedence is 0
      "!": { operation: "negation", precedence: 0 },
      "|": { operation: "disjunction", precedence: 3 },
      "&": { operation: "conjunction", precedence: 3 },
      "->": { operation: "implication", precedence: 2 },
      "<->": { operation: "equivalence", precedence: 1 },
      "!!": { operation: "notEquivalence", precedence: 1 },
      "=|": { operation: "startsWith", precedence: 1 }
    };

    function node(action, args) {
      var r = {
        action,
        args
      };
      if (translate[action]) {
        r.action = translate[action].operation;
      }
      return r;
    }

    function cleanTokens(tokens) {
      if (
        tokens.length &&
        tokens[0].value === "(" &&
        tokens[tokens.length - 1].value === ")"
      ) {
        var trim = true;
        for (var i = 1; i < tokens.length - 1; i++) {
          if (tokens[i].type === "boundary") {
            trim = false;
            break;
          }
        }
        if (trim) {
          tokens = cleanTokens(tokens.slice(1, tokens.length - 1));
        }
      }
      return tokens;
    }

    function processHangLine(tokenSeg) {
      //if not tokens to process return undefined
      if (tokenSeg.length === 0) {
        return;
      }
      //clean up if this is exclusively bounded remove boundaries
      tokenSeg = cleanTokens(tokenSeg);
      //for the set of tokens passed in
      //find the midpoint operation by precedence
      //then call processHangLine for the LH and RH
      //scan left to right to find the precednece center IF we have more than 3 tokens
      if (tokenSeg.length > 1) {
        var maxIndex,
          max = -1;
        for (var i = 0; i < tokenSeg.length; i++) {
          if (
            tokenSeg[i].type === "operator" &&
            (!max || translate[tokenSeg[i].value].precedence > max)
          ) {
            maxIndex = i;
            max = translate[tokenSeg[i].value].precedence;
          } else if (tokenSeg[i].type === "boundary") {
            //handle boundaries - essentially we want to reset the max on the open paren
            if (tokenSeg[i].value === "(") {
              //fast forward to the closing boundary
              while (i < tokenSeg.length && tokenSeg[i].value !== ")") {
                i++;
              }
            }
          }
        }

        if (maxIndex) {
          //we need to create a node from the max index
          var cNode = node(tokenSeg[maxIndex].value, []),
            lhTokens = tokenSeg.slice(0, maxIndex),
            leftHand = processHangLine(lhTokens, cNode),
            rhTokens = tokenSeg.slice(maxIndex + 1),
            rightHand = processHangLine(rhTokens, cNode);

          /*if (cNode.action == "startsWith" && leftHand) {
                        if (rightHand && rightHand.args[0].type === "constant") {
                            if (leftHand.args) {
                                leftHand.args[0].value += rightHand.args[0].value;
                            }
                        }
                    }*/
          cNode.args.push(leftHand);

          if (rightHand) {
            if (leftHand.args && rightHand.args && leftHand.args[0].value) {
              rightHand.args[0].varName = leftHand.args[0].value;
            }
            cNode.args.push(rightHand);
          }
          return cNode;
        }
      }

      if (tokenSeg[0].type === "variable") {
        //ok for a substitution we need to provide a type and seed values for the type
        //how do we get the type? - we have to look at if this is RH or LH
        //we actually want the operator (parent) and then at eval time can get the sibling and comparators
        return node("substitution", [tokenSeg[0]]);
      } else if (tokenSeg[0].type === "constant") {
        //no action required for a constant??
        return tokenSeg[0];
      } else if (tokenSeg[0].type === "boundary") {
        //condition here is no operator with boundary
        //truncate the first term
        return processHangLine(tokenSeg.slice(1));
      } else if (tokenSeg[0].value === "!") {
        var nNode = node("negation", []),
          nrhTokens = tokenSeg.slice(1),
          nrightHand = processHangLine(nrhTokens);
        if (nrightHand) {
          nNode.args.push(nrightHand);
        }
        return nNode;
      } else {
        throw new Error(
          "no token translation executed for " + JSON.stringify(tokenSeg[0])
        );
      }
    }
    return processHangLine(tokens);
  }

  if (!this.ast) {
    this.ast = processAST(this.getTokens());
  }

  if (cb) {
    cb(this.ast);
  }
  return this.ast;
};

//for n = 2 it returns
// [ 0, 0 ]
// [ 0, 1 ]
// [ 1, 0 ]
// [ 1, 1 ]
function generateCombinations(n) {
  if (n == 1) {
    n = 2;
  }
  //we will create an objet array structure here
  var combs = [],
    comb,
    str,
    cnt = Math.pow(2, n);

  for (var i = 0; i < cnt; i++) {
    str = i.toString(2);
    comb = [];

    for (var j = 0; j < n; j++) {
      comb.push(j < n - str.length ? 0 : +str[j - n + str.length]);
    }
    combs.push(comb.slice(0));
  }

  return combs;
}

//Public
module.exports = Condition;
