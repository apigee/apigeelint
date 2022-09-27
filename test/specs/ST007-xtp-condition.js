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
      ruleId = 'ST007',
      path = require("path"),
      debug = require("debug")(`apigeelint:${ruleId}`),
      util = require("util"),
      bl = require("../../lib/package/bundleLinter.js");

const expectedMessageRe =
  new RegExp("For the [A-Za-z]{4,} step \\([-A-Za-z0-9_]{2,}\\), an appropriate check for a message body was not found.");


describe(`${ruleId} - XMLThreatProtection Conditions`, () => {
  function check(suffix, bundleType, expected) {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, `../fixtures/resources/ThreatProtection-Attachment/${bundleType}`),
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
      let proxyEndpointItems = items.filter( m => m.filePath.endsWith(suffix));
      debug(util.format(proxyEndpointItems));
      assert.equal(proxyEndpointItems.length, 1);
      proxyEndpointItems.forEach( item =>
                                  debug(util.format(item.messages)));
      let st007Messages = proxyEndpointItems[0].messages.filter( m => m.ruleId == ruleId);

      debug(util.format(st007Messages));
      assert.equal(st007Messages.length, expected.length);

      expected.forEach( (item, ix) => {
        assert.equal(st007Messages[ix].line, item.line, `case(${ix}) line`);
        assert.equal(st007Messages[ix].column, item.column, `case(${ix}) column`);
        assert.equal(st007Messages[ix].severity, 1, `case(${ix}) severity`);
        assert.ok(st007Messages[ix].message.match(expectedMessageRe), `case(${ix}) message: ${st007Messages[ix].message}`);
      });

    });
  }

  it('should generate the expected warnings in an apiproxy', () => {
      let expected = [
            {
              line: 59,
              column: 9
            },
            {
              line: 94,
              column: 9
            }
          ];
    check('endpoint1.xml', 'apiproxy', expected)
  });

  it('should generate the expected warnings in a sharedflow', () => {
      let expected = [
            {
              line: 10,
              column: 3
            }
          ];
    check('sf-default.xml', 'sharedflowbundle', expected)
  });

});
