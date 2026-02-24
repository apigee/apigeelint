/*
  Copyright 2019-2022,2025 Google LLC

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
  path = require("node:path"),
  debug = require("debug")(`apigeelint:issue546`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`issue546 - proxyEndpoint basepath check`, () => {
  it("should generate no errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PD004-ProxyEndpoint-name/apiproxy",
        ),
        bundleType: "apiproxy",
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      /* This does not test a plugin, but rather the
       * HTTPProxyConnection().getBasePath() method.
       */
      const proxyEndpoints = bundle.getProxyEndpoints();
      assert.ok(proxyEndpoints.length > 1);
      proxyEndpoints.forEach((ep) => {
        let hpc = ep.getHTTPProxyConnection();
        assert.equal(typeof hpc.getBasePath(), "string");
      });
      assert.equal(
        proxyEndpoints.filter(
          (ep) => ep.getHTTPProxyConnection().getBasePath() == "",
        ).length,
        2,
      );
    });
  });
});
