//TruthTable.js

function TruthTable(expression) {
  this.expression = expression || "";
}

TruthTable.prototype.getEvaluation = function() {
  if (!this.evaluation) {
    if (this.expression !== "") {
      if (!this.evaluations) {
        this.evaluations = [];
      }
      var tree = this.getAST(),
        vars = this.getVariables(),
        cons = this.getConstants(),
        c2 = generateCombinationsFromVars(tree, vars); //must generate all combos

      for (var i = 0; i < c2.length; i++) {
        var result = interpret(tree, c2[i]);

        var run = {
          substitutions: c2[i],
          result
        };
        this.evaluations.push(run);
      }

      //based on the values in truth table assess validity
      var trueCount = 0;
      this.evaluations.forEach(function(run) {
        trueCount += 0 + run.result.evaluation.value;
      });
      this.evaluation = trueCount === 0 ? "absurdity" : "valid";
      //consider new evaluation of "unnecessary" when all evaluations are true
    } else {
      this.evaluation = "valid";
    }
  }
  return this.evaluation;
};

TruthTable.prototype.summarize = function() {
  var summary = {};
  summary.condition = this.expression;
  summary.validity = this.getEvaluation();
  return summary;
};

TruthTable.prototype.getVals = function(varName) {
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

function interpret(tree, substitutions) {
  if (!tree) return;
  var iTree = JSON.parse(JSON.stringify(tree)),
    evaluations = [];

  var actions = {
    substitution(args) {
      var result = {
        action: "substitution",
        value: args[0].value,
        type: args[0].type
      };
      if (args[0].type === "variable") {
        result.value = substitutions[args[0].value];
      }
      return result;
    },
    negation(args) {
      var result = {
        action: "negation",
        value: !args[0].evaluation.value
      };
      return result;
    },
    disjunction(args) {
      var result = {
        action: "disjunction",
        value: args[0].evaluation.value || args[1].evaluation.value
      };
      return result;
    },
    conjunction(args) {
      var result = {
        action: "conjunction",
        value: args[0].evaluation.value && args[1].evaluation.value
      };
      return result;
    },
    implication(args) {
      var result = {
        action: "implication",
        value: !args[0].evaluation.value || args[1].evaluation.value
      };
      return result;
    },
    equivalence(args) {
      var result = {
        action: "equivalence",
        value: args[0].evaluation.value === args[1].evaluation.value
      };
      return result;
    },
    notEquivalence(args) {
      var result = {
        action: "notEquivalence",
        value: args[0].evaluation.value !== args[1].evaluation.value
      };
      return result;
    },
    startsWith(args) {
      var result;

      if (args[0].type === "variable" && args[1].type === "variable") {
        result = this.equivalence(args);
      } else {
        result = {
          action: "startsWith",
          value: args[0].evaluation.value
            .toString()
            .startsWith(args[1].evaluation.value.toString())
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

    if (action && !actions[action]) {
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

TruthTable.prototype.getTokens = function() {
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
    return (
      ["!", "|", "&", "->", "<->", "!!", "=|", "~/", "!~/"].indexOf(op) !== -1
    );
  }

  function unrecognizedToken(token, position) {
    throw new Error(
      'Unrecognized token "' + token + '" on position ' + position + ". "
    );
  }

  if (!this.tokens) {
    var expression = " " + this.expression; //in case the expression starts with a logical operator
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
      console.error(this.getExpression());
      var myUtil = require("./myUtil.js");
      console.error(myUtil.getFileName(this));
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

TruthTable.prototype.getVariables = function() {
  if (!this.variables) {
    this.variables = getTokensByType(this.getTokens(), "variable");
  }
  return this.variables;
};

TruthTable.prototype.getConstants = function() {
  if (!this.constants) {
    this.constants = getTokensByType(this.getTokens(), "constant");
  }
  return this.constants;
};

TruthTable.prototype.getAST = function(cb) {
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
        //think about any preprocessing that might need to be done
        var tl = tokenSeg[0].value.toLowerCase();
        if (tl === "true" || tl === "false") {
          tokenSeg[0].value = eval(tl);
        } else {
          tokenSeg[0].value = eval(tokenSeg[0].value);
        }
        return node("substitution", [tokenSeg[0]]);
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

function generateCombinationsFromVars(nodes, vars) {
  //walk the nodes creating the var dictionary
  var varValues = {};

  function process(node) {
    if (node.type === "constant") {
      if (!varValues[node.varName]) {
        varValues[node.varName] = [];
      }
      //the underlying type of the value should guide us on other possible values
      switch (typeof node.value) {
        case "string":
          //strip quotes
          //add the default
          var os = node.value;
          varValues[node.varName].indexOf(os) > -1 ||
            varValues[node.varName].push(os);
          varValues[node.varName].indexOf("z" + os) > -1 ||
            varValues[node.varName].push("z" + os);
          varValues[node.varName].indexOf(os + "z") > -1 ||
            varValues[node.varName].push(os + "z");
          varValues[node.varName].indexOf("") > -1 ||
            varValues[node.varName].push("");
          varValues[node.varName].indexOf("NULL") > -1 ||
            varValues[node.varName].push("NULL");
          break;
        case "boolean":
          varValues[node.varName].indexOf(true) > -1 ||
            varValues[node.varName].push(true);
          varValues[node.varName].indexOf(false) > -1 ||
            varValues[node.varName].push(false);
          break;
        case "number":
          var on = parseInt(node.value);
          varValues[node.varName].indexOf(on) > -1 ||
            varValues[node.varName].push(on);
          varValues[node.varName].indexOf(on - 1) > -1 ||
            varValues[node.varName].push(on - 1);
          varValues[node.varName].indexOf(on + 1) > -1 ||
            varValues[node.varName].push(on + 1);
          varValues[node.varName].indexOf(on * -1) > -1 ||
            varValues[node.varName].push(on * -1);
          varValues[node.varName].indexOf(0) > -1 ||
            varValues[node.varName].push(0);
          varValues[node.varName].indexOf(1) > -1 ||
            varValues[node.varName].push(1);
          break;
      }
    }
    if (node.args) {
      for (var i = 0; i < node.args.length; i++) {
        process(node.args[i]);
      }
    }
  }

  process(nodes);
  //do a post check
  //for each var lets make sure we have an entry
  //if we don't then lets dd it in
  vars.forEach(function(vari) {
    if (!varValues[vari.value]) {
      varValues[vari.value] = [true, false];
    }
  });

  //handle the case of a var with no constants
  //in that case we would inject bool values for them
  var varArray = [],
    keyArray = [];

  for (var key in varValues) {
    varArray.push(varValues[key]);
    keyArray.push(key);
  }

  function cartesianProduct(arr) {
    return arr.reduce(
      function(a, b) {
        return a
          .map(function(x) {
            return b.map(function(y) {
              return x.concat(y);
            });
          })
          .reduce(function(a, b) {
            return a.concat(b);
          }, []);
      },
      [[]]
    );
  }

  var subRes = [];
  cartesianProduct(varArray).forEach(function(subs) {
    //create name value pairs and stick in substitutions
    var subObj = {};
    for (var i = 0; i < keyArray.length; i++) {
      subObj[keyArray[i]] = subs[i];
    }
    subRes.push(subObj);
  });

  return subRes;
}

//Public
module.exports = TruthTable;
