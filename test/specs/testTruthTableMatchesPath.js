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
          evaluation: tt.getEvaluation()
        })
      );
    });
  };

describe("Test TruthTable MatchesPath ", function() {

  test('!(a MatchesPath "c")', "valid");
  test('(a MatchesPath "a") and !(a MatchesPath "c")', "valid");
  test(
    '(a MatchesPath "a"or a MatchesPath "b") and !(a MatchesPath "c")',
    "valid"
  );
  test(
    '(a MatchesPath "a"or a MatchesPath "b") and !(a MatchesPath "c")',
    "valid"
  );
  test(
    '(proxy.pathsuffix MatchesPath "/{version}/products/**"or proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products**") and !(proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products/categories/**"',
    "valid"
  );
  test(
    '(proxy.pathsuffix MatchesPath "/{version}/products/**" or proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products**") and !(proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/products/categories/**"',
    "valid"
  );
  test('(a MatchesPath "a") and !(a MatchesPath "a")', "absurdity");


  // REVIEW AssertionError
  // test('proxy.pathsuffix MatchesPath "/{version}/profile/{profile.id}/paymentmethods/**" and proxy.pathsuffix !MatchesPath "**/initialize" and proxy.pathsuffix !MatchesPath "**/finalize" and request.verb = "GET"',"valid");
  // test('proxy.pathsuffix !MatchesPath "/{version}/profile/{profile.id}/paymentmethods/**")',"valid");
  // test("proxy.pathsuffix MatchesPath \"/{version}/profile/{profile.id}/paymentmethods/**\" and proxy.pathsuffix !MatchesPath \"**/initialize\" ", "valid");
});
