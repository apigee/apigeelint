// assignVariableHygiene.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global process, console, Buffer, describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`PO026 - AssignVariableHygiene`, () => {
  it('should generate the expected errors', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/PO026-assignVariable/apiproxy'),
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

      let expected = {
            'AM-AssignVariable-MissingNameElement.xml' : [
              {
                message: "There is no Name element",
                line: 3,
                column: 3
              }
            ],
            'AM-AssignVariable-MultipleProblems.xml' : [
              {
                message: "There is no Name element",
                line: 4,
                column: 3
              },
              {
                message: "You should have at least one of: {Ref, Value, Template}",
                line: 8,
                column: 3
              },
              {
                message: "The text of the Ref element must be a variable name, should not be wrapped in curlies.",
                line: 15,
                column: 10
              },
              {
                message: "empty AssignVariable. Should have a Name child, and at least one of {Ref, Template, Value}.",
                line: 18,
                column: 3
              },
              {
                message: "There is a stray element (StrayElement)",
                line: 23,
                column: 5
              },
              {
                message: "There is more than one Name element",
                line: 26,
                column: 3
              },
              {
                message: "There is more than one Value element",
                line: 32,
                column: 3
              },
              {
                message: "There is more than one Template element",
                line: 38,
                column: 3
              }
            ]
          };

      Object.keys(expected).forEach( policyName => {
        let policyItems = items.filter( m => m.filePath.endsWith(policyName));
        assert.equal(policyItems.length, 1);
        let po026Messages = policyItems[0].messages.filter( m => m.ruleId == 'PO026');
        assert.equal(po026Messages.length, expected[policyName].length);

        expected[policyName].forEach( (item, ix) => {
          Object.keys(item).forEach( key => {
            assert.equal(po026Messages[ix][key], item[key], `case(${ix}) key(${key})`);
          });
        });
      });

    });
  });

});
