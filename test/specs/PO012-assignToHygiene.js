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

describe(`PO012 - AssignToHygiene`, () => {
  it('should generate the expected errors', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/PO012-assignToHygiene/apiproxy'),
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
            'AM-ModifyRequestRemoveApiKey.xml' : [
              {
                message: "unnecessary AssignTo with no named message",
                line: 20,
                column: 5
              }
            ],
            'AM-SetCorsSecurityHeaders.xml' : [
              {
                message: "unnecessary AssignTo with no named message",
                line: 28,
                column: 5
              }
            ],
            'AM-AssignProxyFlowName.xml' : [
              {
                message: "unnecessary AssignTo with no named message",
                line: 12,
                column: 5
              }
            ],
            'AM-AddCORS.xml' : [
              {
                message: "unnecessary AssignTo with no named message",
                line: 16,
                column: 5
              }
            ]
          };

      let po012Items = items.filter( item => item.messages.some( m => m.ruleId == 'PO012'));
      assert.equal(po012Items.length, Object.keys(expected).length);

      Object.keys(expected).forEach( (policyName, caseNum)  => {
        let policyItems = items.filter( item => item.filePath.endsWith(policyName));
        assert.equal(policyItems.length, 1);
        let po012Messages = policyItems[0].messages.filter( m => m.ruleId == 'PO012');
        assert.equal(po012Messages.length, expected[policyName].length);
        po012Messages.forEach( (m, ix) => assert.equal(m.severity, 1));

        expected[policyName].forEach( (item, ix) => {
          Object.keys(item).forEach( key => {
            assert.equal(po012Messages[ix][key], item[key], `case(${caseNum}) message(${ix}) key(${key})`);
          });
        });
      });

    });
  });

});
