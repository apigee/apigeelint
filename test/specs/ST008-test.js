/*
  Copyright 2019-2024 Google LLC

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
      ruleId = 'ST008',
      path = require("path"),
      debug = require("debug")(`apigeelint:${ruleId}-test`),
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js");

const expectedMessageRe =
  new RegExp("^Step [-A-Za-z0-9_]{2,} is attached after a RaiseFault,.+$");


describe(`${ruleId} - unreachable policies`, () => {
  function check(fileBasename, bundleType, expected) {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, `../fixtures/resources/ST008-unreached-policies-after-raisefault/${bundleType}`),
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
      items = items.filter( m => m.filePath.endsWith(fileBasename));
      debug(util.format(items));
      assert.equal(items.length, 1, `expected:1`);
      items.forEach( item =>
                       debug(util.format(item.messages)));
      let st008Messages = items[0].messages.filter( m => m.ruleId == ruleId);
      debug(util.format(st008Messages));
      assert.equal(st008Messages.length, expected.length);

      expected.forEach( (item, ix) => {
        assert.equal(st008Messages[ix].line, item.line, `case(${ix}) line`);
        assert.equal(st008Messages[ix].column, item.column, `case(${ix}) column`);
        assert.equal(st008Messages[ix].severity, 1, `case(${ix}) severity`);
        assert.ok(st008Messages[ix].message.match(expectedMessageRe), `case(${ix}) message ${st008Messages[ix].message}`);
      });
    });
  }

  it('should find the expected warnings in an apiproxy', () => {
    let expected = [
          {
            line: 19,
            column: 7
          },
          {
            line: 22,
            column: 7
          },
          {
            line: 79,
            column: 9
          }
        ];

    check('endpoint1.xml', 'apiproxy', expected);
  });

  it('should not find warnings when the RaiseFault policy is not enabled', () => {
    let expected = [
          {
            line: 79,
            column: 9
          }
        ];

    check('endpoint2.xml', 'apiproxy', expected);
  });

  it('should find the expected warnings in a sharedflow', () => {
    let expected = [
          { line: 9, column: 3 }
        ];
    check('sf-default.xml', 'sharedflowbundle', expected);
  });

});
