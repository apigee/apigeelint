/*
  Copyright 2019,2025 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const debug = require("debug")("apigeelint:TruthTable"),
  minimatch = require("minimatch");

const EXPECT = {
  EXPR_START_OR_NEGATION: 1,
  EXPR_START: 2,
  RHS: 3,
  COMPARISON_OP: 4,
  LOGICAL_OPERATOR: 5,
};

const expectingToString = (n) =>
  Object.keys(EXPECT).reduce((acc, cur) => {
    if (EXPECT[cur] == n) {
      acc = cur;
    }
    return acc;
  }, "UNKNOWN");

function TruthTable(expression) {
  this.expression = expression || "";
}

TruthTable.prototype.getEvaluation = function () {
  if (!this.evaluation) {
    if (this.expression !== "") {
      if (!this.evaluations) {
        this.evaluations = [];
      }
      var tree = this.getAST(),
        vars = this.getVariables(),
        c2 = generateCombinationsFromVars(tree, vars);

      for (var i = 0; i < c2.length; i++) {
        var result = interpret(tree, c2[i]);

        var run = {
          substitutions: c2[i],
          result,
        };
        this.evaluations.push(run);
      }

      //based on the values in truth table assess validity
      var trueCount = 0;
      this.evaluations.forEach(function (run) {
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

TruthTable.prototype.summarize = function () {
  var summary = {};
  summary.condition = this.expression;
  summary.validity = this.getEvaluation();
  return summary;
};

TruthTable.prototype.getVals = function (varName) {
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
        type: args[0].type,
      };
      if (args[0].type === "variable") {
        result.value = substitutions[args[0].value];
      }
      return result;
    },
    negation(args) {
      var result = {
        action: "negation",
        value: !args[0].evaluation.value,
      };
      return result;
    },
    disjunction(args) {
      var result = {
        action: "disjunction",
        value: args[0].evaluation.value || args[1].evaluation.value,
      };
      return result;
    },
    conjunction(args) {
      var result = {
        action: "conjunction",
        value: args[0].evaluation.value && args[1].evaluation.value,
      };
      return result;
    },
    implication(args) {
      var result = {
        action: "implication",
        value: !args[0].evaluation.value || args[1].evaluation.value,
      };
      return result;
    },
    equivalence(args) {
      var result = {
        action: "equivalence",
        value: args[0].evaluation.value === args[1].evaluation.value,
      };
      return result;
    },
    notEquivalence(args) {
      var result = {
        action: "notEquivalence",
        value: args[0].evaluation.value !== args[1].evaluation.value,
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
            .startsWith(args[1].evaluation.value.toString()),
        };
      }
      return result;
    },
    like(args) {
      var result = {
        action: "like",
        value:
          args[0].evaluation.value
            .toString()
            .toLowerCase()
            .indexOf(args[1].evaluation.value.toString().toLowerCase()) >= 0,
      };
      return result;
    },
    javaRegex(args) {
      var result = {
        action: "javaRegex",
        value:
          args[0].evaluation.value
            .toString()
            .toLowerCase()
            .indexOf(args[1].evaluation.value.toString().toLowerCase()) >= 0,
      };
      return result;
    },
    matches(args) {
      var result = {
        action: "matches",
        value: minimatch(
          args[0].evaluation.value.toString(),
          args[1].evaluation.value.toString(),
        ),
      };
      return result;
    },
    matchesCaseInsensitive(args) {
      var result = {
        action: "matchesInsensitive",
        value: minimatch(
          args[0].evaluation.value.toString().toLowerCase(),
          args[1].evaluation.value.toString().toLowerCase(),
        ),
      };
      return result;
    },
    notMatches(args) {
      return !actions.matches(args);
    },
    notLike(args) {
      var result = {
        action: "notLike",
        value:
          args[0].evaluation.value
            .toString()
            .toLowerCase()
            .indexOf(args[1].evaluation.value.toString().toLowerCase()) == -1,
      };
      return result;
    },
    equalsCaseInsensitive(args) {
      var result = {
        action: "equalsCaseInsensitive",
        value:
          args[0].evaluation.value.toString().toLowerCase() ===
          args[1].evaluation.value.toString().toLowerCase(),
      };
      return result;
    },
    greaterThan(args) {
      var result = {
        action: "greaterThan",
        value: args[0].evaluation.value > args[1].evaluation.value,
      };
      return result;
    },
    lessThan(args) {
      var result = {
        action: "lessThan",
        value: args[0].evaluation.value < args[1].evaluation.value,
      };
      return result;
    },
    greaterThanEqualTo(args) {
      var result = {
        action: "greaterThanEqualTo",
        value: args[0].evaluation.value >= args[1].evaluation.value,
      };
      return result;
    },
    lessThanEqualTo(args) {
      var result = {
        action: "lessThanEqualTo",
        value: args[0].evaluation.value <= args[1].evaluation.value,
      };
      return result;
    },
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
      throw new Error(`missing action for ${action}`);
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

TruthTable.prototype.getTokens = function () {
  debug(`getTokens()`);
  var pointer = 0,
    tokens = [],
    c = "";

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
    var encodeDictionary = {
      "=": "%3D",
      "!": "%21",
      "(": "%28",
      ")": "%29",
    };

    if (!replace) {
      replace = encodeURI(find);
    }
    //encode some specials here
    if (encodeDictionary[replace]) {
      replace = encodeDictionary[replace];
    }
    var result = _encodeWithin(source, find, replace, '"');
    result = _encodeWithin(result, find, replace, '"');
    return result;
  }

  function replaceAll(s, f, r) {
    var regex = new RegExp(_escapeRegExp(f), "gi");
    return s.replace(regex, r);
  }

  function isWhiteSpace(ch) {
    return /\s/.test(ch);
  }

  function isVariable(ch) {
    return /[A-Za-z_]/.test(ch);
  }

  // function isOperatorWord(ch) {
  //   //this can get confused with some string constants including regex
  //   if (typeof ch === "string" && ch.startsWith('"')) {
  //     return false;
  //   }
  //   return /[<>\|&!~:=]/.test(ch);
  // }

  function isConstant(ch) {
    if (typeof ch === "string") {
      let up = ch.toUpperCase(ch);
      if (up === "FALSE" || up === "TRUE" || up === "NULL") {
        return true;
      }
    }
    //need to add test for -1
    let regtest = /^-?[0-9]*$/.test(ch) || /[\"\']/.test(ch);
    return regtest;
  }

  // function isExpressionBoundary(ch) {
  //   return /[\(\)]/.test(ch);
  // }

  const unaryOperator = (op) => op === "!";

  const logicalOperator = (op) => ["|", "&"].indexOf(op) !== -1;

  const comparison = (op) =>
    [
      "->",
      "<->",
      "!!",
      "=|",
      "~/",
      "!~/",
      "!~",
      "~",
      "/~",
      ">",
      "<",
      ">=",
      "<=",
      "=>",
      "=<",
      ":=",
      ":~",
      "~:",
      "~~",
    ].indexOf(op) !== -1;

  function unrecognizedToken(token, position, expecting) {
    throw new Error(
      `Unrecognized token '${token}' at position ${position}. Expecting: ${expectingToString(expecting)}`,
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

    //space and special characters wihin a quote needs to be encoded so as not to get replaced
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
    expression = replaceAll(expression, " OR ", " || ");
    expression = replaceAll(expression, " JavaRegex ", " ~~ ");
    expression = replaceAll(expression, " Matches ", " ~/ ");
    expression = replaceAll(expression, " MatchesCaseInsensitive ", " ~/i ");
    expression = replaceAll(expression, " Like ", " ~ ");
    expression = replaceAll(expression, " LikeCaseInsensitive ", " ~i ");
    expression = replaceAll(expression, " ! Like ", " !~ ");
    expression = replaceAll(expression, " !Like ", " !~ ");
    expression = replaceAll(expression, " MatchesPath ", " ~/ ");
    expression = replaceAll(expression, " !MatchesPath ", " !~/ ");

    expression = replaceAll(expression, " LikePath ", " ~/ ");
    //expression = replaceAll(expression, " Starts ", " == ");
    //expression = replaceAll(expression, " Starts ", " =| ");
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
    expression = replaceAll(expression, "=", " = ");
    expression = replaceAll(expression, "> =", " >= ");
    expression = replaceAll(expression, "< =", " <= ");
    expression = replaceAll(expression, ": =", " := ");
    expression = replaceAll(expression, " = ", " <-> ");
    expression = replaceAll(expression, "<-> |", " =| ");

    //expression = replaceAll(expression, ":=", " <-> ");
    expression = replaceAll(expression, "~~", " ~~ ");
    //expression = replaceAll(expression, "!~/", " !! ");
    //expression = replaceAll(expression, "~/", " <-> ");

    expression = replaceAll(expression, "&&", " & ");
    expression = replaceAll(expression, "||", " | ");
    expression = replaceAll(expression, "%", "x"); // what is this?
    expression = replaceAll(expression, "!", " ! ");
    expression = replaceAll(expression, " ! ~ ", " !~ ");
    expression = replaceAll(expression, " !  ~ ", " !~ ");

    expression = replaceAll(expression, " !  ! ", " !! ");
    while (expression.indexOf("  ") >= 0) {
      expression = replaceAll(expression, "  ", " ");
    }
    expression = expression.trim();

    var input = expression.split(" ");
    debug(`input: ` + JSON.stringify(input));
    let expecting = EXPECT.EXPR_START_OR_NEGATION;
    //find next space delimited word
    const next = () => (c = input[pointer++]);
    const tpush = (type, value) => tokens.push({ type, value });
    let parenDepth = 0;
    try {
      while (next()) {
        debug(`word: (${c}) expecting(${expectingToString(expecting)})`);
        if (unaryOperator(c)) {
          debug(`unary`);
          if (
            expecting != EXPECT.EXPR_START_OR_NEGATION &&
            expecting != EXPECT.EXPR_START
          ) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          tpush("unaryOp", c);
          expecting = EXPECT.EXPR_START;
        } else if (logicalOperator(c)) {
          debug(`logicalOperator`);
          if (expecting != EXPECT.LOGICAL_OPERATOR) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          tpush("logicalOp", c);
          expecting = EXPECT.EXPR_START_OR_NEGATION;
        } else if (comparison(c)) {
          debug(`comparison`);
          if (expecting != EXPECT.COMPARISON_OP) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          tpush("comparison", c);
          expecting = EXPECT.RHS;
        } else if (isWhiteSpace(c)) {
          debug(`whitespace`);
          unrecognizedToken(c, pointer - 1, expecting);
        } else if (c === "(") {
          debug(`openParen`);
          if (
            expecting != EXPECT.EXPR_START &&
            expecting != EXPECT.EXPR_START_OR_NEGATION &&
            expecting != EXPECT.RHS
          ) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          parenDepth++;
          tpush("boundary", c);
          expecting = EXPECT.EXPR_START_OR_NEGATION;
        } else if (c === ")") {
          debug(`closeParen`);
          if (expecting == EXPECT.COMPARISON_OP) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          if (parenDepth == 0) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          parenDepth--;
          tpush("boundary", c);
          expecting = EXPECT.LOGICAL_OPERATOR;
        } else if (isConstant(c)) {
          debug(`isConstant`);
          if (
            expecting != EXPECT.EXPR_START &&
            expecting != EXPECT.EXPR_START_OR_NEGATION &&
            expecting != EXPECT.RHS
          ) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          tpush("constant", c);
          expecting = EXPECT.LOGICAL_OPERATOR;
        } else if (isVariable(c)) {
          debug(`isVariable`);
          if (
            expecting != EXPECT.EXPR_START &&
            expecting != EXPECT.EXPR_START_OR_NEGATION &&
            expecting != EXPECT.RHS
          ) {
            unrecognizedToken(c, pointer - 1, expecting);
          }
          tpush("variable", c);

          expecting =
            expecting === EXPECT.RHS
              ? EXPECT.LOGICAL_OPERATOR
              : EXPECT.COMPARISON_OP;
        } else {
          debug(`unrecognizedToken`);
          unrecognizedToken(`unrec(${c})`, pointer - 1, expecting);
        }
      }
    } catch (e) {
      debug(`Error: ${e}`);
      throw e;
    }
    if (expecting == EXPECT.COMPARISON_OP) {
      throw new Error(
        `Incomplete expression, expecting(${expectingToString(expecting)})`,
      );
    }
    if (parenDepth != 0) {
      throw new Error(`Un-terminated grouping`);
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
    .sort(function (a, b) {
      return a.value > b.value ? 1 : -1;
    })
    .filter(function (item, index, arr) {
      return arr.indexOf(item) === index;
    });
  return result;
}

TruthTable.prototype.getVariables = function () {
  if (!this.variables) {
    this.variables = getTokensByType(this.getTokens(), "variable");
  }
  return this.variables;
};

TruthTable.prototype.getConstants = function () {
  if (!this.constants) {
    this.constants = getTokensByType(this.getTokens(), "constant");
  }
  return this.constants;
};

TruthTable.prototype.getAST = function (cb) {
  debug(`getAST()`);
  function processAST(tokens) {
    var translate = {
      //highest precedence is 0
      "!": { operation: "negation", precedence: 0 },
      "|": { operation: "disjunction", precedence: 3 },
      "&": { operation: "conjunction", precedence: 3 },
      "->": { operation: "implication", precedence: 2 },
      "<->": { operation: "equivalence", precedence: 1 },
      ":=": { operation: "equalsCaseInsensitive", precedence: 1 },
      "!!": { operation: "notEquivalence", precedence: 1 },
      "~~": { operation: "javaRegex", precedence: 1 },
      "=|": { operation: "startsWith", precedence: 1 },
      "~": { operation: "like", precedence: 1 },
      "!~": { operation: "notLike", precedence: 1 },
      ">": { operation: "greaterThan", precedence: 1 },
      "<": { operation: "lessThan", precedence: 1 },
      ">=": { operation: "greaterThanEqualTo", precedence: 1 },
      "<=": { operation: "lessThanEqualTo", precedence: 1 },
      "=>": { operation: "greaterThanEqualTo", precedence: 1 },
      "=<": { operation: "lessThanEqualTo", precedence: 1 },
      "/~": { operation: "matches", precedence: 1 },
      "~/": { operation: "matches", precedence: 1 },
      "!~/": { operation: "notMatches", precedence: 1 },
      ":~": { operation: "matchesCaseInsensitive", precedence: 1 },
      "~:": { operation: "matchesCaseInsensitive", precedence: 1 },
    };

    function node(action, args) {
      var r = {
        action,
        args,
      };
      if (translate[action]) {
        r.action = translate[action].operation;
      } /* else {
        r.action = "UnrecognizedOperation";
      }*/
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
      debug(`tokenSeg(` + JSON.stringify(tokenSeg) + ")");
      //if no tokens to process return undefined
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
            (tokenSeg[i].type.endsWith("Op") ||
              tokenSeg[i].type == "comparison") &&
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
          try {
            // should be a string or number.
            tokenSeg[0].value = eval(tokenSeg[0].value);
          } catch (e) {
            // not a valid token
            debug(`not a valid token: (${tokenSeg[0].value})`);
            tokenSeg[0].valid = false;
          }
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
        debug(
          "no token translation executed for " + JSON.stringify(tokenSeg[0]),
        );
      }
    }
    return processHangLine(tokens);
  }

  if (!this.ast) {
    this.ast = processAST(this.getTokens());
  }

  if (typeof cb == "function") {
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
  vars.forEach(function (vari) {
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
      function (a, b) {
        return a
          .map(function (x) {
            return b.map(function (y) {
              return x.concat(y);
            });
          })
          .reduce(function (a, b) {
            return a.concat(b);
          }, []);
      },
      [[]],
    );
  }

  var subRes = [];
  cartesianProduct(varArray).forEach(function (subs) {
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
