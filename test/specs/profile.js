// profile.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global process, console, Buffer, describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`PO026 - PropertySetRef with --profile 'apigeex' for PO026-apigeex-proxy`, () => {
  it('should NOT generate errors for ProperSetRef', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/PO026-apigeex-proxy/apiproxy'),
            bundleType: "apiproxy"
          },
          excluded: {},
          setExitCode: false,
          output: () => {}, // suppress output
          profile: "apigeex"
        };

    bl.lint(configuration, (bundle) => {
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
  it('should generate errors for ProperSetRef', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/PO026-apigeex-proxy/apiproxy'),
            bundleType: "apiproxy"
          },
          excluded: {},
          setExitCode: false,
          output: () => {}, // suppress output
          profile: "apigee"
        };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      items.forEach( (item) => {
        // console.log( item );
        if( item.filePath === "/apiproxy/policies/AM-config-properties.xml") {
            assert.equal(item.errorCount,6);
        }
      });
    });
  });
});
