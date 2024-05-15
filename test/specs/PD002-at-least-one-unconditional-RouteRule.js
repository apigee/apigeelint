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

const ruleId = "PD002",
  assert = require("assert"),
  path = require("path"),
  util = require("util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - proxy bundle with no unconditional RouteRule`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PD002-no-unconditional-routerule/proxy1/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      profile: "apigeex",
      excluded: { TD004: true, TD002: true },
      setExitCode: false,
      output: () => {} // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      assert.ok(actualErrors.length);
      debug(util.format(actualErrors));
      debug(JSON.stringify(actualErrors));

      const ep1 = actualErrors.find((e) =>
        e.filePath.endsWith("endpoint1.xml")
      );
      assert.ok(ep1);
      debug(util.format(ep1.messages));
      const pd002Messages = ep1.messages.filter((m) => m.ruleId == "PD002");
      assert.equal(pd002Messages.length, 1);
      assert.ok(pd002Messages[0].message);
      assert.equal(
        pd002Messages[0].message,
        "There is no RouteRule with no Condition. Your proxy may not operate correctly."
      );
    });
  });
});

describe(`${ruleId} - proxy bundle with no RouteRule`, () => {
  it("should generate the expected errors", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PD002-no-unconditional-routerule/proxy2/apiproxy"
        ),
        bundleType: "apiproxy"
      },
      profile: "apigeex",
      excluded: { TD004: true, TD002: true },
      setExitCode: false,
      output: () => {} // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      debug(util.format(actualErrors));
      debug(JSON.stringify(actualErrors));
      assert.ok(actualErrors.length);

      const ep1 = actualErrors.find((e) =>
        e.filePath.endsWith("endpoint1.xml")
      );
      assert.ok(ep1);
      debug(util.format(ep1.messages));
      const pd002Messages = ep1.messages.filter((m) => m.ruleId == "PD002");
      assert.equal(pd002Messages.length, 1);
      assert.ok(pd002Messages[0].message);
      assert.equal(pd002Messages[0].message, "There is no RouteRule.");
    });
  });
});

describe(`${ruleId} - sharedflow bundle - no RouteRules at all`, () => {
  it("should generate no error", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PD002-no-unconditional-routerule/sharedflow1/sharedflowbundle"
        ),
        bundleType: "sharedflowbundle"
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      debug(util.format(actualErrors));
      debug(JSON.stringify(actualErrors));
      assert.equal(actualErrors.length, 0);
    });
  });
});

describe(`${ruleId} - sharedflow bundle with a RouteRule`, () => {
  it("should generate the expected error", () => {
    const configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/PD002-no-unconditional-routerule/sharedflow2/sharedflowbundle"
        ),
        bundleType: "sharedflowbundle"
      },
      profile: "apigeex",
      excluded: {},
      setExitCode: false,
      output: () => {} // suppress output
    };

    bl.lint(configuration, (bundle) => {
      const items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      const actualErrors = items.filter(
        (item) => item.messages && item.messages.length
      );
      debug(util.format(actualErrors));
      debug(JSON.stringify(actualErrors));
      assert.equal(actualErrors.length, 1);

      const sf1 = actualErrors.find((e) => e.filePath.endsWith("default.xml"));
      assert.ok(sf1);
      debug(util.format(sf1.messages));
      const pd002Messages = sf1.messages.filter((m) => m.ruleId == "PD002");
      assert.equal(pd002Messages.length, 1);
      assert.ok(pd002Messages[0].message);
      assert.equal(
        pd002Messages[0].message,
        "Misplaced RouteRule in a SharedFlow."
      );
    });
  });
});
