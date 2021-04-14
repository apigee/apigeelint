// profile.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global console, describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

let commonConfiguration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(__dirname, '../fixtures/resources/PO026-apigeex-proxy/apiproxy'),
        bundleType: "apiproxy"
      },
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };


describe(`PO026 - PropertySetRef with --profile 'apigeex' for PO026-apigeex-proxy`, () => {
  it('should NOT generate errors for PropertySetRef', () => {
    bl.lint({ ...commonConfiguration, profile: "apigeex" }, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      items.forEach( (item) => {
        // console.log( item );
        if( item.filePath === "/apiproxy/policies/AM-config-properties.xml") {
            assert.equal(item.errorCount,0);
        }
      });
    });
  });
});

describe(`PO026 - PropertySetRef with --profile 'apigee' for PO026-apigeex-proxy`, () => {
  it('should generate errors for PropertySetRef', () => {
    const expectedErrors = [
            "There is a stray element (PropertySetRef)",
            "There is a stray element (PropertySetRef)",
            "You should have at least one of: {Ref,Value,Template}",
            "There is a stray element (PropertySetRef)",
            "You should have at least one of: {Ref,Value,Template}"
          ];
    bl.lint({ ...commonConfiguration, profile: "apigee" }, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      items.forEach( (item) => {
        // console.log( item );
        if( item.filePath === "/apiproxy/policies/AM-config-properties.xml") {
          assert.equal(item.errorCount,5);
          item.messages.forEach( (msg, ix) => {
            assert.ok(msg.ruleId == 'PO026');
            assert.ok(expectedErrors[ix] == msg.message);
          });
        }
      });
    });
  });
});
