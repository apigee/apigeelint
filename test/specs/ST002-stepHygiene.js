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

describe(`ST002 - StepHygiene`, () => {
  it('should generate the expected errors', () => {
  let configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: path.resolve(__dirname, '../fixtures/resources/ST002-step-hygiene/apiproxy'),
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
      let st002Messages = proxyEndpointItems[0].messages.filter( m => m.ruleId == 'ST002');
      assert.equal(st002Messages.length, 3);

      let expected = [
            {
              line: 13,
              column: 5,
              message: "Multiple Name elements for Step"
            },
            {
              line: 34,
              column: 7,
              message: "Multiple Condition elements for Step"
            },
            {
              line: 57,
              column: 7,
              message: "Stray element (Step) under Step"
            }
          ];
      expected.forEach( (item, ix) => {
        Object.keys(item).forEach( key => {
          assert.equal(st002Messages[ix][key], item[key], `case(${ix}) key(${key})`);
        });
      });

    });
  });

});
