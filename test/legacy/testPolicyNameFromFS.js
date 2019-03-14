
var assert = require("assert"),
  debug = require("debug")("bundlelinter:flowNames");

var Policy = require("../../lib/package/Policy.js"),
  test = function(folder,file, assertion) {
    it("testing policy names ", function() {
      //function Policy(path, fn, parent)
      var policy = new Policy(folder, file, this);

      result = policy.getDisplayName();

      assert.deepEqual(
        result,
        assertion,
        result ? "names did not match" : "names matched"
      );
    });
  };

describe("Test Policy Names From FS", function() {

  test(
    "./test/fixtures/","JS-Log-To-Stackdriver.xml",
    "JS-Log-To-Stackdriver"
  );

});
