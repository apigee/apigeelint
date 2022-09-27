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
      ruleId = 'ST004',
      path = require("path"),
      debug = require("debug")(`apigeelint:${ruleId}`),
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js");

const expectedMessageRe =
  new RegExp("For the ExtractVariables step \\([-A-Za-z0-9_]{2,}\\), an appropriate check for a message body was not found.");

describe(`${ruleId} - ExtractVariables XMLPayload Conditions`, () => {
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
      debug('all items: ' + util.format(items));
      let itemsForFileOfInterest = items.filter( m => m.filePath.endsWith(suffix));
      debug('items for that filepath: ' + util.format(itemsForFileOfInterest));
      assert.equal(itemsForFileOfInterest.length, 1);
      // itemsForFileOfInterest.forEach( item =>
      //                  debug(util.format(item.messages)));
      let st004Messages = itemsForFileOfInterest[0].messages.filter( m => m.ruleId == ruleId);

      debug(`ST004 messages (${st004Messages.length}): ` + util.format(st004Messages));
      assert.equal(st004Messages.length, expected.length);

      expected.forEach( (item, ix) => {
        assert.equal(st004Messages[ix].line, item.line, `case(${ix}) line`);
        assert.equal(st004Messages[ix].column, item.column, `case(${ix}) column`);
        assert.equal(st004Messages[ix].severity, 1, `case(${ix}) severity`);
        assert.ok(st004Messages[ix].message.match(expectedMessageRe), `case(${ix}) message`);
      });
    });
  }

  it('should generate the expected warnings in an apiproxy', () => {
    let expected = [
            {
              line: 29,
              column: 7
            },
            {
              line: 38,
              column: 7
            },
            {
              line: 164,
              column: 9
            },
            {
              line: 176,
              column: 9
            },
            {
              line: 189,
              column: 9
            },
            {
              line: 240,
              column: 9
            }
          ];
    check('endpoint1.xml', 'apiproxy', expected);
  });

  it('should find the expected warnings in a sharedflow', () => {
    let expected = [
          { line: 12, column: 3 }
        ];
    check('sf-default.xml', 'sharedflowbundle', expected);
  });

});
