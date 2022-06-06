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
const assert = require('assert'),
      testID = 'FR001',
      debug = require('debug')(`apigeelint:${testID}`),
      util = require('util'),
      path = require('path'),
      Bundle = require('../../lib/package/Bundle.js'),
      bl = require('../../lib/package/bundleLinter.js');

describe(`${testID} - check condition on FaultRules`, function() {

  let configuration = {
        debug: true,
        source: {
          type: 'filesystem',
          path: path.resolve(__dirname, '../fixtures/resources/FR001/apiproxy'),
          bundleType: 'apiproxy'
        },
        profile: 'apigee',
        excluded: {},
        setExitCode: false,
        output: () => {} // suppress output
      };

  debug('test configuration: ' + JSON.stringify(configuration));

  bl.lint(configuration, bundle => {
    let items = bundle.getReport();
      let itemsWithFR001Errors = items.filter(item =>
                                              item.messages && item.messages.length &&
                                              item.messages.find( m => m.ruleId == testID));

    it('should generate the expected errors', () => {
      assert.ok(items);
      assert.ok(items.length);
      assert.equal(itemsWithFR001Errors.length, 4);
    });

    it('should generate a warning for proxy endpoint1', () => {
      let proxyEp1Error = itemsWithFR001Errors.find( item => item.filePath == '/apiproxy/proxies/endpoint1.xml');
      assert.ok(proxyEp1Error);

      let messages = proxyEp1Error.messages.filter(msg => msg.ruleId == testID);
      assert.ok(messages);
      assert.equal(messages.length, 1);
      assert.ok(messages[0].message.indexOf('Consider migrating to DefaultFaultRule') > 0);
      assert.equal(messages[0].severity, 1);
    });

    it('should generate an error for proxy endpoint2', () => {
      let proxyEp2Error = itemsWithFR001Errors.find( item => item.filePath == '/apiproxy/proxies/endpoint2.xml');
      assert.ok(proxyEp2Error);
      let messages = proxyEp2Error.messages.filter(msg => msg.ruleId == testID);
      assert.ok(messages);
      assert.equal(messages.length, 1);
      assert.ok(messages[0].message.indexOf('FaultRule (rule2) has no Condition or the Condition is empty') > 0);
      assert.equal(messages[0].severity, 2);
    });

    it('should generate no error for proxy endpoint3', () => {
      let proxyEp3Error = itemsWithFR001Errors.find( item => item.filePath == '/apiproxy/proxies/endpoint3.xml');
      assert.ok( ! proxyEp3Error);
    });

    it('should generate no error for target1', () => {
      let targetEp1Error = itemsWithFR001Errors.find( item => item.filePath == '/apiproxy/targets/target1.xml');
      messages = targetEp1Error && targetEp1Error.messages.filter(msg => msg.ruleId == testID);
      assert.ok( !targetEp1Error || messages.length == 0);
    });

    it('should generate an error for target2', () => {
      let targetEp2Error = itemsWithFR001Errors.find( item => item.filePath == '/apiproxy/targets/target2.xml');
      assert.ok( targetEp2Error );
      messages = targetEp2Error.messages.filter(msg => msg.ruleId == testID);
      assert.ok(messages);
      assert.equal(messages.length, 1);
      assert.equal(messages[0].severity, 2);
      assert.ok(messages[0].message.indexOf('FaultRule (rule1) has no Condition or the Condition is empty') > 0);
    });

    it('should generate a warning for target3', () => {
      let targetEp3Error = itemsWithFR001Errors.find( item => item.filePath == '/apiproxy/targets/target3.xml');
      assert.ok( targetEp3Error );
      messages = targetEp3Error.messages.filter(msg => msg.ruleId == testID);
      assert.ok(messages);
      assert.equal(messages.length, 1);
      assert.equal(messages[0].severity, 1);
      assert.equal(messages[0].message.indexOf('Just one FaultRule and no Condition. Consider migrating to DefaultFaultRule'), 0);
    });

    // generate a full report and check the format of the report
    it('should create a report object with valid schema', function() {
      let formatter = bl.getFormatter('json.js');

      if (!formatter) {
        assert.fail('formatter implementation not defined');
      }
      let schema = require('./../fixtures/reportSchema.js'),
          Validator = require('jsonschema').Validator,
          v = new Validator(),
          jsonReport = JSON.parse(formatter(items)),
          validationResult = v.validate(jsonReport, schema);

      assert.equal(
        validationResult.errors.length,
        0,
        validationResult.errors
      );
    });
  });

});
