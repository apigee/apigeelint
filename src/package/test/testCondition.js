//dumpBundle.js
var Condition = require("../Condition.js"),
    myUtil = require("../myUtil.js"),
    Dom = require("xmldom").DOMParser,
    test = function (exp, assertion) {
        var doc = new Dom().parseFromString(exp);
        var c = new Condition(doc, this);

        //myUtil.inspect(c.getExpression());
        //myUtil.inspect(c.getTokens());
        //myUtil.inspect(c.getAST());

        var tt = c.getTruthTable();
        if (tt.evaluation !== assertion) {
            myUtil.inspect({
                expression: c.getExpression(),
                ast: c.getAST(),
                assertion,
                evaluation: tt.evaluation
            });
        } else {
            myUtil.inspect({
                expression: c.getExpression(),
                assertion
            });
        }
    };

test("b=c", "valid");
test("b!=c", "valid");
test("b!=b", "absurdity");
test("b=1", "valid");
test("b=2", "valid");
test("true and b!=c", "valid");
test("false", "absurdity");
test("true", "valid");
test("true OR false", "valid");
test("b=1 and b!=1", "absurdity");
test("(b=1)", "valid");
test("((b=1))", "valid");
test("(b=1) and (b!=1)", "absurdity");
test("(a = b) and (b=c) and (a!=c)", "absurdity");
test("(b=2)", "valid");
test("(b=0)", "valid");
test("(b)", "valid");
test("b", "valid");
test("!b", "valid");
test("!(b)", "valid");
test("(!b)", "valid");
test("b=c and d=e", "valid");
test("(b=c) and (d=e)", "valid");
test("true AND false", "absurdity");
test("(a = b) and (b=c) and (a!=c)", "absurdity");
test("(a STARTSWITH b OR c=d) AND (d=c OR x=y) AND a!=b and c=e and e=d and c!=d", "valid");
test("b and b", "valid");
test("(b and b)", "valid");
test("((b and b))", "valid");
test("((b) and (b))", "valid");
test("(b and !b)", "absurdity");
test("((b and !b))", "absurdity");
test("((b) and (!b))", "absurdity");
test("((b) and !(b))", "absurdity");
test("b and !b", "absurdity");
test("(b=1) and (b!=1)", "absurdity");
test("request.verb=\"POST\" and request.verb!=\"POST\"", "absurdity");