/*
  Copyright 2019-2021,2025 Google LLC

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
  debug = require("debug")("apigeelint:ST002"),
  util = require("util"),
  bl = require("../../lib/package/bundleLinter.js");

describe(`ST002 - StepHygiene - apiproxy`, () => {
  it("should generate the expected errors", () => {
    let configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/ST002-step-hygiene/apiproxy",
        ),
        bundleType: "apiproxy",
      },
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      debug(util.format(items));
      let proxyEndpointItems = items.filter((m) =>
        m.filePath.endsWith("endpoint1.xml"),
      );
      debug(util.format(proxyEndpointItems));
      assert.equal(proxyEndpointItems.length, 1);
      proxyEndpointItems.forEach((item) => debug(util.format(item.messages)));
      let st002Messages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId == "ST002",
      );

      let expected = [
        {
          line: 13,
          column: 5,
          message: "Multiple Name elements for Step",
        },
        {
          line: 23,
          column: 5,
          message: "Name value should not have leading/trailing whitespace",
        },
        {
          line: 34,
          column: 7,
          message: "Multiple Condition elements for Step",
        },
        // {
        //   line: 44,
        //   column: 7,
        //   message: "empty Name element",
        // },
        // {
        //   line: 50,
        //   column: 7,
        //   message: "Missing Name element for Step",
        // },
        // {
        //   line: 53,
        //   column: 7,
        //   message: "Missing Name element for Step",
        // },
        {
          line: 58,
          column: 7,
          message: "Stray element (Step) under Step",
        },
        {
          line: 66,
          column: 7,
          message: "Stray element under Name element",
        },
        {
          line: 86,
          column: 9,
          message: "empty Condition element",
        },
        {
          line: 91,
          column: 9,
          message: "empty Condition element",
        },
        {
          line: 96,
          column: 9,
          message: "Stray element under Condition element",
        },
      ];

      debug(util.format(st002Messages));
      assert.equal(st002Messages.length, expected.length);

      expected.forEach((item, ix) => {
        Object.keys(item).forEach((key) => {
          assert.equal(
            st002Messages[ix][key],
            item[key],
            `case(${ix}) key(${key})`,
          );
        });
      });
    });
  });
});
