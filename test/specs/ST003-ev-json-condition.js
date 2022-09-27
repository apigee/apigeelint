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
      ruleId = 'ST003',
      path = require("path"),
      debug = require("debug")(`apigeelint:${ruleId}`),
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js");

const expectedMessageRe =
  new RegExp("^For the ExtractVariables step \\([-A-Za-z0-9_]{2,}\\), an appropriate check for a message body was not found\\..*");

describe(`${ruleId} - ExtractVariables JSONPayload Conditions`, () => {
  function check(suffix, bundleType, expected) {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, `../fixtures/resources/ExtractVariables-Attachment/${bundleType}`),
            bundleType
          },
          excluded: {},
          setExitCode: false,
          output: () => {} // suppress output
        };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      debug(util.format(items));
      let sfItems = items.filter( m => m.filePath.endsWith(suffix));
      debug(util.format(sfItems));
      assert.equal(sfItems.length, 1);
      sfItems.forEach( item =>
                       debug(util.format(item.messages)));
      let st003Messages = sfItems[0].messages.filter( m => m.ruleId == ruleId);
      debug(util.format(st003Messages));
      assert.equal(st003Messages.length, expected.length);

      expected.forEach( (item, ix) => {
        assert.equal(st003Messages[ix].line, item.line, `case(${ix}) line`);
        assert.equal(st003Messages[ix].column, item.column, `case(${ix}) column`);
        assert.equal(st003Messages[ix].severity, 1, `case(${ix}) severity`);
        assert.ok(st003Messages[ix].message.match(expectedMessageRe), `case(${ix}) message`);
      });
    });
  }

  it('should find the expected warnings in an apiproxy', () => {
    let expected = [
          {
            line: 100,
            column: 9
          },
          {
            line: 112,
            column: 9
          },
          {
            line: 125,
            column: 9
          }
        ];

    check('endpoint1.xml', 'apiproxy', expected);
  });

  it('should find the expected warnings in a sharedflow', () => {
    let expected = [
          { line: 5, column: 3 }
        ];
    check('sf-default.xml', 'sharedflowbundle', expected);
  });

});
