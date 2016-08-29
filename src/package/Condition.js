//Condition.js

//Private
var fs = require("fs"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser,
    myUtil = require("./myUtil.js");

function Condition(element, parent) {
    this.parent = parent;
    this.element = element;
}

Condition.prototype.getExpression = function() {
    return this.element.childNodes && this.element.childNodes[0] && this.element.childNodes[0].nodeValue || "";
};

Condition.prototype.getElement = function() {
    return this.element;
};

Condition.prototype.getParent = function() {
    return this.parent;
};

Condition.prototype.warn = function(msg) {
    this.parent.warn(msg);
};

Condition.prototype.err = function(msg) {
    this.parent.err(msg);
};

Condition.prototype.onConditions = function(pluginFunction) {
    pluginFunction(this);
};

Condition.prototype.summarize = function() {
    var summary = {};
    summary.condition = this.getExpression();
    return summary;
};

function interpret(tree, substitutions) {
    var iTree = JSON.parse(JSON.stringify(tree));
    var actions = {
        substitution(args) {
            var result = { value: !!args[0].value, type: args[0].type, expressionValue: args[0].value, parent: args[0].parent };
            if (args[0].type === "variable") {
                result.value = substitutions[args[0].value];
            } else if (args[0].type === "constant") {
                if (args[0].value.toUpperCase() === "FALSE") {
                    result.value = false;
                }
            }
            return result;
        },
        negation(args) {
            var result = { value: !args[0].value };
            return result;
        },
        disjunction(args) {
            var result = { value: args[0].value || args[1].value };
            return result;
        },
        conjunction(args) {
            var result = { value: args[0].value && args[1].value };
            return result;
        },
        implication(args) {
            var result = { value: !args[0].value || args[1].value };
            return result;
        },
        equivalence(args) {
            var result = { value: (args[0].value && args[1].value) || (!args[0].value && !args[1].value) };
            return result;
        },
        notEquivalence(args) {
            var result = { value: (args[0].value && !args[1].value) || (!args[0].value && args[1].value) };
            return result;
        }
    };

    function process(node) {

        var action = node.action,
            args = node.args;

        for (var i = 0; i < args.length; i++) {
            if (args[i] && args[i].args) { args[i] = process(args[i]); }
        }
        if (typeof actions[action] !== "function") {
            if (typeof action === "object") {
                action = JSON.stringify(action) + " action should be string not object";
            }
            throw new Error("Process error on  action \"" + action + "\"");
        }
        node.result = actions[action](args);
        return node.result;
    }

    var result = process(iTree);
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

function _evaluate(evaluation, tree, vars) {
    var initializator = getInitializator(vars);
    var result = interpret(tree, initializator.apply(initializator, evaluation));
    return result;
}

Condition.prototype.getTruthTable = function() {
    var vars = this.getVariables(),
        combinations = generateCombinations(vars.length),
        truthTable = { expression: this.getExpression(), evaluations: [] },
        tree = this.getAST();


    for (var i = 0, count = Math.pow(2, vars.length); i < count; i++) {
        var run = {
            substitutions: combinations[i],
            evaluation: _evaluate(combinations[i], tree, vars).value,
        };
        truthTable.evaluations.push(run);
    }

    //based on the values in truth table assess validity
    var trueCount = 0;
    truthTable.evaluations.forEach(function(run) {
        if (run.evaluation) { trueCount++; }
    });

    if (trueCount === 0) {
        truthTable.evaluation = "absurdity";
    } else {
        truthTable.evaluation = "valid";
    }
    return truthTable;
};

Condition.prototype.getTokens = function() {
    var pointer = 0,
        tokens = [],
        c, operator = "";

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
        if (!replace) { replace = encodeURI(find); }
        var result = _encodeWithin(source, find, replace, "\"");
        result = _encodeWithin(result, find, replace, "\"");
        return (result);
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

    function isWhiteSpace(c) {
        return /\s/.test(c);
    }

    function isVariable(c) {
        return /[A-Za-z]/.test(c);
    }

    function isSpecial(c) {
        return /[<>\-|&!]/.test(c);
    }

    function isConstant(c) {
        if (typeof c === "string") {
            var up = c.toUpperCase(c);
            if (up === "FALSE" || up === "TRUE") {
                return true;
            }
        }
        return /[0-9\"\"]/.test(c);
    }

    function isExpressionBoundary(c) {
        return /[\(\)]/.test(c);
    }

    function operatorExists(op) {
        return ["!", "|", "&", "->", "<->", "!!"].indexOf(op) !== -1;
    }

    function unrecognizedToken(token, position) {
        throw new Error("Unrecognized token \"" + token + "\" on position " + position + "!");
    }

    if (!this.tokens) {
        var expression = this.getExpression();
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
        expression = replaceAll(expression, " LikePath ", " ~/ ");
        expression = replaceAll(expression, " Starts ", " =| ");
        expression = replaceAll(expression, " StartsWith ", " =| ");
        expression = replaceAll(expression, "(", " ( ");
        expression = replaceAll(expression, ")", " ) ");
        expression = replaceAll(expression, "\t", " ");
        expression = replaceAll(expression, "\n", " ");
        expression = expression.trim();
        expression = replaceAll(expression, "=|", " <-> ");
        expression = replaceAll(expression, "!=", " !! ");
        expression = replaceAll(expression, "=", " <-> ");
        expression = replaceAll(expression, ":=", " <-> ");
        expression = replaceAll(expression, "~~", " <-> ");
        expression = replaceAll(expression, "~/", " <-> ");
        expression = replaceAll(expression, "&&", " & ");
        expression = replaceAll(expression, "||", " | ");
        expression = replaceAll(expression, "%", "x");
        //remove duplicate spaces 
        while (expression.indexOf("  ") >= 0) {
            expression = replaceAll(expression, "  ", " ");
        }

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
                    if (operator.length) { unrecognizedToken(operator, pointer - operator.length - 1); }

                    if (isWhiteSpace(c)) {
                        continue;
                    } else if (isExpressionBoundary(c)) { push("boundary", c); } else if (isConstant(c)) { push("constant", c); } else if (isVariable(c)) { push("variable", c); } else { unrecognizedToken(c, pointer - 2); }
                }
            }
        } catch (e) {
            console.log(e);
            throw new Error("Lex error on \"" + input + "\"");
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
    result.sort(function(a, b) {
        return a.value > b.value ? 1 : -1;
    }).filter(function(item, index, arr) {
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
        this.constants = getTokensByType(this.getTokens(), "constants");
    }
    return this.constants;
};

Condition.prototype.getAST = function() {
    var tokens = this.getTokens(),
        translate = {
            "!": "negation",
            "|": "disjunction",
            "&": "conjunction",
            "->": "implication",
            "<->": "equivalence",
            "!!": "notEquivalence"
        };

    function process(operation) {
        operation = operation || null;
        var args = [];

        function node(action, args, parent) {
            return {
                action: translate[action] || action,
                args,
                parent
            };
        }

        function isUnary(op) {
            return op === "!";
        }

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === "boundary") {
                if (token.value === "(") {
                    var result = process();
                    if (result.action === null && result.args.length === 1) {
                        args.push(result.args[0]);
                    } else {
                        args.push(result);
                    }
                } else if (token.value === ")") {
                    return node(operation, args, token);
                }
            } else if (token.type === "variable" || token.type === "constant") {
                args.push(node("substitution", [token], token));
                if (isUnary(operation)) {
                    if (operation === null && args.length === 1) {
                        return args[0];
                    }
                    return node(operation, args, token);
                }
            } else if (token.type === "operator") {
                if (isUnary(token.value)) {
                    args.push(process(token));
                    continue;
                }
                if (operation) {
                    var tmp = args.slice(0);
                    args = [];
                    args.push(node(operation, tmp, token));
                }
                operation = token.value;
            }
        }
        if (operation === null && args.length === 1) {
            return args[0];
        }
        return node(operation, args, token);
    }

    if (!this.ast) {
        this.ast = process();
    }
    return this.ast;
};

//for n = 2 it returns
// [ 0, 0 ]
// [ 0, 1 ]
// [ 1, 0 ]
// [ 1, 1 ]
function generateCombinations(n) {
    var combs = [];
    var comb;
    var str;

    for (var i = 0; i < Math.pow(2, n); i++) {
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
