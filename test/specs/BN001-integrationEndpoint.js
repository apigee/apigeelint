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

const ruleId = 'BN001',
      assert = require("assert"),
      path = require("path"),
      util = require("util"),
      debug = require("debug")(`apigeelint:${ruleId}`),
      bl = require("../../lib/package/bundleLinter.js");

describe(`BN001 - bundle with properties resource`, () => {
  it('should generate the expected errors', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/BN001-integration-endpoint/apiproxy'),
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
      let actualIssues = items.filter(item => item.messages && item.messages.length && item.messages.find( m => m.ruleId == ruleId));
      assert.equal(actualIssues.length, 0);
    });
  });

});
