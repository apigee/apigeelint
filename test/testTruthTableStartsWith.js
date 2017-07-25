//testTruthTable

var assert = require("assert"),
  TruthTable = require("../lib/package/TruthTable.js"),
  test = function(exp, assertion) {
    it(exp + " should match " + assertion + ".", function() {
      var tt = new TruthTable(exp);

      assert.equal(
        tt.getEvaluation(),
        assertion,
        JSON.stringify({
          truthTable: tt,
          evaluation: tt.getEvaluation()
        })
      );
    });
  };

test('a ="foobar"', "valid");
test('a StartsWith "foo"', "valid");
test('a StartsWith "foo" AND a ="foobar"', "valid");
test('a StartsWith "foo" AND a !="foobar"', "valid");
test('a StartsWith "foo" AND a !="foo"', "valid");
test('a StartsWith "foo" AND a ="bar"', "absurdity");
test('a StartsWith "foo" AND a StartsWith "bar"', "absurdity");
test('a StartsWith "foo" AND a ="foobar"', "valid");
test('a StartsWith "boo" AND a ="foobar"', "absurdity");
test(
  "(a StartsWith b OR c=d) AND (d=c OR x=y) AND a!=b and c=e and e=d and c!=d",
  "absurdity"
);

