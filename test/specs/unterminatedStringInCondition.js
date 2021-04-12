// unterminatedStringInCondition.js
// ------------------------------------------------------------------
//
/* jshint esversion:9, node:true, strict:implied */
/* global process, console, Buffer, describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`CC005 - Unterminated String in Condition`, () => {
  it('should generate the expected errors', () => {
  let configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: path.resolve(__dirname, '../fixtures/resources/CC005-unterminated-string-in-condition/apiproxy'),
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
      let proxyEndpointItems = items.filter( m => m.filePath.endsWith('endpoint1.xml'));
      assert.equal(proxyEndpointItems.length, 1);
      let cc005Messages = proxyEndpointItems[0].messages.filter( m => m.ruleId == 'CC005');
      assert.equal(cc005Messages.length, 3);

      let expected = [
            {
              line: 16,
              column: 11,
              message: "Possible unterminated string: (\"OPTIONS)"
            },
            {
              line: 34,
              column: 7,
              message: "unmatched parenthesis - possibly due to an unterminated string"
            },
            {
              line: 46,
              column: 7,
              message: "Possible unterminated string: (GET\")"
            }
          ];
      expected.forEach( (item, ix) => {
        Object.keys(item).forEach( key => {
          assert.equal(cc005Messages[ix][key], item[key], `case(${ix}) key(${key})`);
        });
      });

    });
  });

});
