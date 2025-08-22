/*
  Copyright © 2025 Google LLC

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

describe(`issue567 - HTTPTargetConnection check`, () => {
  // This tests the HTTPTargetConnection().getProperties() method.
  it("should generate no errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/iss-567-bundle/apiproxy",
        ),
        bundleType: "apiproxy",
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const targetEndpoints = bundle.getTargetEndpoints();
      assert.ok(targetEndpoints.length > 1);
      targetEndpoints.forEach((endpoint) => {
        const httpTargetConnection = endpoint.getHTTPTargetConnection();
        if (httpTargetConnection) {
          let properties = httpTargetConnection.getProperties();
          assert.ok(properties);
        }
      });
    });
  });
});
