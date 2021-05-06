// xsdResourceTest.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`BN001 - bundle with XSD resource`, () => {
  it('should generate the expected errors', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/BN001-xsd-resources/apiproxy'),
            bundleType: "apiproxy"
          },
          excluded: {},
          setExitCode: false,
          output: () => {} // suppress output
        };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      let actualErrors = items.filter(item => item.messages && item.messages.length);
      assert.equal(actualErrors.length, 1);
      assert.ok(actualErrors[0].messages.length);
      assert.equal(actualErrors[0].messages.length, 1);
      assert.ok(actualErrors[0].messages[0].message);
      assert.ok(actualErrors[0].messages[0].message.startsWith('Unexpected extension found with file'),
               actualErrors[0].messages[0].message);
      assert.ok(actualErrors[0].messages[0].message.indexOf("set1.properties") > 0,
               actualErrors[0].messages[0].message);

    });
  });

});
