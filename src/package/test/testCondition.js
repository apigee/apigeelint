//dumpBundle.js

var Condition = require("../Condition.js"),
    myUtil = require("../myUtil.js"),
    Dom = require("xmldom").DOMParser,
    test = function(exp, assertion) {
        var doc = new Dom().parseFromString(exp);
        var c = new Condition(doc, this);
        var tt = c.getTruthTable();
        if (tt.evaluation !== assertion) {
            myUtil.inspect({
                expression: c.getExpression(),
                assertion,
                evaluation: tt.evaluation
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
test("request.verb=\"POST\" and request.verb!=\"POST\"", "absurdity");

//test("(a = b) and (b=c) and (a!=c)");
//test("(b=1)")
//test("(b=2)")
//test("(b=0)")
//test("!(b)");
//-
//-test("b and !b");
//test("(b=c) and (d=e)");
//operator in final term is not parsing properly
//test("(b=1) and (b!=1)");
//test("true AND false");
//test("(a = b) and (b=c) and (a!=c)");

//test("(a STARTSWITH b OR c=d) AND (d=c OR x=y) AND a!=b and c=e and e=d and c!=d");

//
