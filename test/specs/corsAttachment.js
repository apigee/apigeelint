// corsAttachment.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`EP001 - bundle with properties resource`, () => {
  it('should generate the expected errors', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/EP001-cors-attachment/apiproxy'),
            bundleType: "apiproxy"
          },
          profile: 'apigeex',
          excluded: {},
          setExitCode: false,
          output: () => {} // suppress output
        };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      let actualErrors = items.filter(item => item.messages && item.messages.length);
      assert.equal(actualErrors.length, 2);
      assert.ok(actualErrors[0].messages.length);
      assert.equal(actualErrors[0].messages.length, 3);
      assert.ok(actualErrors[0].messages[0].message);
      assert.equal(actualErrors[0].messages[0].message, 'There are multiple CORS policies and policy CORS-1 is attached to a Step without a Condition.');
      assert.equal(actualErrors[0].messages[1].message, 'There are multiple CORS policies and policy CORS-2 is attached to a Step without a Condition.');
      assert.ok(actualErrors[0].messages[2].message.startsWith('There are multiple CORS policies attached, at least one without a condition.'));


      assert.ok(actualErrors[1].messages.length);
      assert.equal(actualErrors[1].messages.length, 1);
      assert.ok(actualErrors[1].messages[0].message);
      assert.equal(actualErrors[1].messages[0].message, 'There is a CORS policy attached to a TargetEndpoint.  Attach CORS policies to a ProxyEndpoint.');

    });
  });

});
