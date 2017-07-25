//testTruthTable

var assert = require("assert"),
  TruthTable = require("../lib/package/TruthTable.js"),
  test = function(exp, assertion) {
    it(exp + " should match " + assertion + ".", function() {
      var tt = new TruthTable(exp),
      ast=tt.getAST();

      console.log(ast);
    });
  };


test("b!=1", "valid");
test("b=c", "valid");
test("b=2", "valid");
test("b!=c", "valid");
test("b=c and d=e", "valid");
test("request.headers.foo = \"myFoo\"");

