//dumpBundle.js
var Condition = require("../Condition.js"),
    myUtil = require("../myUtil.js"),
    Dom = require("xmldom").DOMParser,
    test = function (exp, assertion) {
        var doc = new Dom().parseFromString(exp);
        var c = new Condition(doc, this);

        //myUtil.inspect(c.getExpression());
        //myUtil.inspect(c.getTokens());
        //c.getAST(myUtil.inspect());

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
test("(a = b OR c=d) AND a!=b AND c!=d", "absurdity");
test("a StartsWith \"foo\" AND a =\"foobar\"", "valid");
test("a StartsWith \"foo\" AND a !=\"foobar\"", "valid");
test("(a StartsWith b OR c=d) AND (d=c OR x=y) AND a!=b and c=e and e=d and c!=d", "absurdity");
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
test("(req.pin.value ~~ \"[0-9][0-9][0-9][0-9]\")", "valid");
test("req.pin.value=\"\" or req.pin.value=null or not (req.pin.value ~~ \"[0-9][0-9][0-9][0-9]\")", "valid");
test("purchase_purchase_0__statusLog_0__status!=\"Authorized\" and purchase.paymentmethod.type != \"paypal\"", "valid");
test("!(a MatchesPath \"c\")", "valid");
test("(a MatchesPath \"a\") and !(a MatchesPath \"c\")", "valid");
test("(a MatchesPath \"a\"or a MatchesPath \"b\") and !(a MatchesPath \"c\")", "valid");
test("(a MatchesPath \"a\"or a MatchesPath \"b\") and !(a MatchesPath \"c\")", "valid");
test("(proxy.pathsuffix MatchesPath \"/{version}/products/**\"or proxy.pathsuffix MatchesPath \"/{version}/profile/{profile.id}/products**\") and !(proxy.pathsuffix MatchesPath \"/{version}/profile/{profile.id}/products/categories/**\"", "valid");
test("(proxy.pathsuffix MatchesPath \"/{version}/products/**\" or proxy.pathsuffix MatchesPath \"/{version}/profile/{profile.id}/products**\") and !(proxy.pathsuffix MatchesPath \"/{version}/profile/{profile.id}/products/categories/**\"", "valid");
test("(a MatchesPath \"a\") and !(a MatchesPath \"a\")", "absurdity");
test("request.verb = \"GET\" and request.verb = \"POST\"", "absurdity");
