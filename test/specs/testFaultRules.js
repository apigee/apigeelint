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

const assert = require("node:assert"),
      debug = require("debug")("apigeelint:faultrules"),
      Bundle = require("../../lib/package/Bundle.js"),
      util = require("node:util");

const configuration = {
  debug: false,
  source: {
    type: "filesystem",
    path: "./test/fixtures/resources/default-fault-rules/apiproxy",
    bundleType: "apiproxy"
  },
  excluded: {}
};

describe("FaultRules", () => {
  debug("test configuration: " + JSON.stringify(configuration));
  let utilOptions = { showhidden:false, depth: 3, maxArrayLength: 10 };
  let bundle = new Bundle(configuration);

  it('should find the fault rules in the proxy endpoint', () => {
    let proxyEPs = bundle.getProxyEndpoints();
    debug("bundle.getProxyEndpoints().length = " + proxyEPs.length);
    assert.equal(proxyEPs.length, 1);
    assert.ok(proxyEPs[0].getDefaultFaultRule());
    debug("pep.getDefaultFaultRule() \n" +
          util.inspect(proxyEPs[0].getDefaultFaultRule().summarize(), utilOptions));

    assert.ok(proxyEPs[0].getFaultRules());
    assert.equal(proxyEPs[0].getFaultRules().length, 2);
  });

  it('should find the fault rules in the target endpoint', () => {
    let targetEPs = bundle.getTargetEndpoints();
    assert.equal(targetEPs.length, 1);
    assert.ok(targetEPs[0].getDefaultFaultRule());
    debug("tep.getDefaultFaultRule(): \n" +
            util.inspect(targetEPs[0].getDefaultFaultRule().summarize(), utilOptions));
    assert.ok(targetEPs[0].getFaultRules());
    assert.equal(targetEPs[0].getFaultRules().length, 0);
  });

  it('should find the appropriate number of defaultfaultrules', () => {
    assert.ok(bundle.getDefaultFaultRules());
    assert.equal(bundle.getDefaultFaultRules().length, 2);
  });

});
