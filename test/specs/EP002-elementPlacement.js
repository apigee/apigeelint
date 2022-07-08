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
      bl = require("../../lib/package/bundleLinter.js");

describe(`EP002 - bundle with misplaced elements`, () => {

    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/EP002/apiproxy'),
            bundleType: "apiproxy"
          },
          profile: 'apigeex',
          excluded: {},
          setExitCode: false,
          output: () => {} // suppress output
        };

  bl.lint(configuration, (bundle) => {
    let items = bundle.getReport();
    let ep002Errors = items.filter(item => item.messages && item.messages.length &&
                                   item.messages.find(m => m.ruleId == 'EP002'));

    it('should generate the expected errors', () => {
      assert.ok(items);
      assert.ok(items.length);
      assert.equal(ep002Errors.length, 2);
    });

    it('should generate messages for the proxy endpoint', () => {
      let util = require('util');
      let proxyEp1Errors = ep002Errors.filter( item => item.filePath == '/apiproxy/proxies/endpoint1.xml');
      assert.ok(proxyEp1Errors);
      assert.equal(proxyEp1Errors.length, 1);
      let expectedErrors = [
            'Extra FaultRules element',
            'Invalid Framjo element',
            'Misplaced DefaultFaultRule element child of Framjo',
            'Misplaced Step element child of PostClientFlow',
            'Invalid Flow element'
          ];
      proxyEp1Errors[0].messages.forEach( msg => {
        assert.ok(msg.message);
        assert.ok(expectedErrors.includes(msg.message));
        expectedErrors = expectedErrors.filter( item => item != msg.message);
      });
    });

    it('should generate messages for the target endpoint', () => {
      let targetErrors = ep002Errors.filter( item => item.filePath == '/apiproxy/targets/http-1.xml');
      assert.ok(targetErrors);
      assert.equal(targetErrors.length, 1);
      let expectedErrors = [
            'Extra Flows element',
            'Invalid MisPlaced element',
            'Invalid RouteRule element'
          ];
      targetErrors[0].messages.forEach( msg => {
        assert.ok(msg.message);
        assert.ok(expectedErrors.includes(msg.message));
        expectedErrors = expectedErrors.filter( item => item != msg.message);
      });
    });
  });
});
