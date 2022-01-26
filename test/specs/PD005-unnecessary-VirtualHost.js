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

const ruleId = 'PD005',
      assert = require("assert"),
      path = require("path"),
      util = require("util"),
      debug = require("debug")(`apigeelint:${ruleId}`),
      bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - bundle with VirtualHost elements`, () => {
  let profiles = ['apigee','apigeex'];

  profiles.forEach( profile =>
                    it('should generate the expected errors', () => {
                      let configuration = {
                            debug: true,
                            source: {
                              type: "filesystem",
                              path: path.resolve(__dirname, '../fixtures/resources/PD005-VirtualHost/apiproxy'),
                              bundleType: "apiproxy"
                            },
                            profile,
                            excluded: {},
                            setExitCode: false,
                            output: () => {} // suppress output
                          };

                      bl.lint(configuration, (bundle) => {
                        let items = bundle.getReport();
                        assert.ok(items);
                        assert.ok(items.length);
                        let actualIssues = items.filter(item => item.messages && item.messages.length && item.messages.find( m => m.ruleId == ruleId));
                        if (profile == 'apigeex') {
                          assert.equal(actualIssues.length, 1);
                          debug(util.format(actualIssues));

                          let ep2 = actualIssues.find(e => e.filePath.endsWith('endpoint1.xml'));
                          assert.ok(ep2);
                          debug(util.format(ep2.messages));
                          assert.equal(ep2.messages.length, 1);
                          assert.ok(ep2.messages[0].message);
                          assert.equal(ep2.messages[0].message, 'Unnecessary VirtualHost element.');
                          assert.equal(ep2.messages[0].ruleId, ruleId);
                        }
                        else {
                          assert.equal(actualIssues.length, 0);
                        }
                      });
                    }));

});
