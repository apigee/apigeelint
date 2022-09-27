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
      ruleId = 'ST005',
      path = require("path"),
      debug = require("debug")(`apigeelint:${ruleId}`),
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js");

const expectedMessage =
        "For the ExtractVariables step, an appropriate check for a message body was not found on the enclosing Step or Flow.";

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

      itemsForFileOfInterest.forEach( (item, ix) =>
                                      debug(`item ${ix}: ` + util.format(item.messages)));

      let st005Messages = itemsForFileOfInterest[0].messages.filter( m => m.ruleId == ruleId);
      debug(`ST005 messages (${st005Messages.length}): ` + util.format(st005Messages));
      assert.equal(st005Messages.length, expected.length);
      expected.forEach( (item, ix) => {
        assert.equal(st005Messages[ix].line, item.line, `case(${ix}) line`);
        assert.equal(st005Messages[ix].column, item.column, `case(${ix}) column`);
        assert.equal(st005Messages[ix].message, expectedMessage, `case(${ix}) message`);
      });

    });
  }

  it('should generate the expected errors in an apiproxy', () => {
      let expected = [
            {
              line: 48,
              column: 7
            },
            {
              line: 54,
              column: 7
            },
            {
              line: 72,
              column: 7
            },
            {
              line: 254,
              column: 9
            }
          ];
    check('endpoint1.xml', "apiproxy", expected);
  });

  it('should generate the expected errors in a sharedflow', () => {
      let expected = [
            {
              line: 36,
              column: 3
            }
          ];
    check('sf-default.xml', "sharedflowbundle", expected);
  });

});
