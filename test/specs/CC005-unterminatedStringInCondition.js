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

const testID = "CC005",
      assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js"),
      debug = require("debug")(`apigeelint:${testID}-test`);

describe(`${testID} - Unterminated Strings in Condition`, () => {
  it('should generate the expected errors', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/CC005/proxy1/apiproxy'),
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

      let otherMessages = proxyEndpointItems[0].messages.filter( m => m.ruleId != 'CC005');
      debug(`other messages: ` + JSON.stringify(otherMessages, null, 2));
      let expected = [
            {
              line: 29,
              column: 11,
              message: "Possible unterminated string: (\"OPTIONS)"
            },
            {
              line: 47,
              column: 7,
              message: "unmatched parenthesis - possibly due to an unterminated string"
            },
            {
              line: 59,
              column: 7,
              message: "Possible unterminated string: (GET\")"
            }
          ];
      expected.forEach( (item, ix) => {
        Object.keys(item).forEach( key => {
          assert.ok(cc005Messages[ix]);
          assert.ok(cc005Messages[ix][key]);
          assert.equal(cc005Messages[ix][key], item[key], `case(${ix}) key(${key})`);
        });
      });

    });
  });

  it('should not hang', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/CC005/issue483/apiproxy'),
            bundleType: "apiproxy"
          },
          profile: "apigeex",
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
      assert.equal(cc005Messages.length, 0);

      let otherMessages = proxyEndpointItems[0].messages.filter( m => m.ruleId != 'CC005');
      debug(`other messages: ` + JSON.stringify(otherMessages, null, 2));
      assert.notEqual(otherMessages.length, 0);

    });
  });

});
