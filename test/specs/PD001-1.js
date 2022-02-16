/*
  Copyright 2019-2022 Google LLC

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
      testID = "PD001",
      bl = require("../../lib/package/bundleLinter.js");

describe(`${testID} - bundle with reference to missing target`, () => {
  it('should generate the expected error', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/PD001-missing-target/apiproxy'),
            bundleType: "apiproxy"
          },
          profile: 'apigee',
          excluded: {},
          setExitCode: false,
          output: () => {} // suppress output
        };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      let itemsWithErrors = items.filter(item =>
                                         item.messages && item.messages.length &&
                                         item.messages.find( m => m.ruleId == testID));
      assert.equal(itemsWithErrors.length, 1);
      assert.ok(itemsWithErrors[0].messages.length);
      let diags = JSON.stringify(itemsWithErrors[0].messages);
      assert.equal(itemsWithErrors[0].messages.length, 2, diags);
      let expectedErrors = [
            'RouteRule refers to an unknown TargetEndpoint (target1).',
            'RouteRule specifies an empty TargetEndpoint.'
          ];

      itemsWithErrors[0].messages.forEach( (e, ix) => {
        assert.ok(e.message, diags);
        assert.equal(e.message, expectedErrors[ix], e.message);
      });
    });
  });
});
