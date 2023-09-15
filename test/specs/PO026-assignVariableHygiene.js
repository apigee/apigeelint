/*
  Copyright 2019-2021 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/* global describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`PO026 - AssignVariableHygiene`, () => {
  it('should generate the expected errors', () => {
    const configuration = {
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
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);

      const expected = {
            'AM-AssignVariable-MissingNameElement.xml' : [
              {
                message: "There is no Name element",
                line: 3,
                column: 3
              }
            ],
            'AM-AssignVariable-TooManyNameElements.xml' : [
              {
                message: "There is more than one Name element",
                line: 3,
                column: 3
              }
            ],
            'AM-AssignVariable-RefWithCurlies.xml' : [
              {
                message: "The text of the Ref element must be a variable name, should not include curlies",
                line: 7,
                column: 10
              }
            ],
            'AM-AssignVariable-MultipleProblems.xml' : [
              {
                message: "There is no Name element",
                line: 4,
                column: 3
              },
              {
                message: "You should have at least one of: {Ref,Value,Template}",
                line: 8,
                column: 3
              },
              {
                message: "The text of the Ref element must be a variable name, should not include curlies",
                line: 15,
                column: 10
              },
              {
                message: "empty AssignVariable. Should have a Name child, and at least one of {Ref,Value,Template}.",
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

      Object.keys(expected).forEach( (policyName, px) => {
        const policyItems = items.filter( m => m.filePath.endsWith(policyName));
        assert.equal(policyItems.length, 1);
        const po026Messages = policyItems[0].messages.filter( m => m.ruleId == 'PO026');
        assert.equal(po026Messages.length, expected[policyName].length);

        expected[policyName].forEach( (item, ix) => {
          Object.keys(item).forEach( key => {
            assert.equal(po026Messages[ix][key], item[key], `case(${px},${ix}) key(${key})`);
          });
        });
      });

    });
  });

});
