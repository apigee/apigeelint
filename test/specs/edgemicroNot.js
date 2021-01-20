// assignToHygiene.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global process, console, Buffer, describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`TD002 - Not an Edgemicro proxy`, () => {
  it('should generate Target Server warning', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/TD002-edgemicro-not/apiproxy'),
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
      items.forEach( (item) => {
        if( item.filePath === "/apiproxy/targets/default.xml") {
            assert.equal(item.warningCount,1);
        }
      });
    });
  });
});
