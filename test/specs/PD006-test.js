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

const ruleId = "PD006",
  assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")(`apigeelint:${ruleId}-test`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - proxyEndpoint basepath and other hygiene`, () => {
  let reportedItems = null;

  const insure = (cb) => {
    if (reportedItems == null) {
      const configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: path.resolve(__dirname, "../fixtures/resources/PD006/apiproxy"),
          bundleType: "apiproxy",
        },
        profile: "apigeex",
        excluded: {},
        setExitCode: false,
        output: () => {}, // suppress output
      };

      bl.lint(configuration, (bundle) => {
        reportedItems = bundle.getReport();
        assert.ok(reportedItems);
        assert.ok(reportedItems.length);
        debug(util.format(reportedItems));
        cb();
      });
    } else {
      cb();
    }
  };

  it("should lint the bundle", () => {
    insure(() => {
      assert.ok(reportedItems);
      assert.ok(reportedItems.length);
    });
  });

  const expectations = {
    "endpoint1.xml": [],
    "endpoint2.xml": [],
    "endpoint3.xml": ["Missing required BasePath element."],
    "endpoint4.xml": ["More than one BasePath element found."],
  };

  Object.keys(expectations).forEach((key) => {
    let expectedMsgs = expectations[key];
    it(`should find ${expectedMsgs.length > 0 ? "the expected errors" : "no errors"} in ${key}`, () => {
      const epItems = reportedItems.filter((e) => e.filePath.endsWith(key));
      assert.ok(epItems);
      debug(util.format(epItems));
      //assert.equal(expectations[key], epItems.length);
      assert.equal(1, epItems.length);
      let pd006Messages = epItems[0].messages.filter((m) => m.ruleId == ruleId);
      debug(util.format(pd006Messages));
      assert.equal(expectedMsgs.length, pd006Messages.length);
      expectedMsgs.forEach((msg) =>
        assert.ok(
          pd006Messages.find((m) => m.message == msg),
          `Cannot find ${msg} in ${pd006Messages.map((e) => e.message).toString()}`,
        ),
      );
    });
  });
});
