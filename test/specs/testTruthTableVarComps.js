//testTruthTable

var assert = require("assert"),
  TruthTable = require("../../lib/package/TruthTable.js"),
  test = function(exp, assertion) {
    it(exp + " should match " + assertion + ".", function() {
      var tt = new TruthTable(exp);

      assert.equal(
        tt.getEvaluation(),
        assertion,
        JSON.stringify({
          truthTable: tt,
          evaluation: tt.evaluation
        })
      );
    });
  };

describe("Test TruthTable VarComps ", function() {

  test("b=c", "valid");
  test("b!=c", "valid");
  test("b!=b", "absurdity");
  test("true and b!=c", "valid");
  test("b=c and d=e", "valid");
  test("(b=c) and (d=e)", "valid");
  test("(a = b OR c=d) AND a!=b AND c!=d", "absurdity");
  test("b and b", "valid");
  test("(b and b)", "valid");
  test("((b and b))", "valid");
  test("((b) and (b))", "valid");
  test("(b and !b)", "absurdity");
  test("((b and !b))", "absurdity");
  test("((b) and (!b))", "absurdity");
  test("((b) and !(b))", "absurdity");
  test("b and !b", "absurdity");
  test('request.verb="POST" and request.verb!="POST"', "absurdity");

});
